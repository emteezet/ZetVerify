import { IdentityService } from "../services/IdentityService";
import { WalletService } from "../services/WalletService";
import { IdentityError, ErrorCodes as IdentityErrorCodes } from "../lib/errors/AppError";

// Mock the Logger to avoid polluting test output
jest.mock("../lib/utils/logger", () => ({
    Logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    }
}));

describe("IdentityService Security: Race Conditions", () => {
    let mockWalletService;
    let mockProvider;
    let identityService;
    const userId = "test-user-123";
    const fee = 150;

    beforeEach(() => {
        // Mock Wallet Service with stateful balance simulation
        let balance = 200; // Enough for only ONE verification at 150
        mockWalletService = {
            getBalance: jest.fn(async () => balance),
            debitWallet: jest.fn(async (uid, amt) => {
                if (balance < amt) {
                    const err = new Error("Insufficient wallet balance");
                    err.message = "no_negative_balance"; // Simulate the DB constraint message
                    throw err;
                }
                balance -= amt;
                return { success: true };
            }),
            refundWallet: jest.fn(async (uid, amt) => {
                balance += amt;
                return { success: true };
            })
        };

        // Mock Provider with controllable delay
        mockProvider = {
            fetchByNin: jest.fn(async () => {
                // Simulate network latency (very important for race condition test)
                await new Promise(resolve => setTimeout(resolve, 50));
                return { success: true, data: { firstName: "John", nin: "12345678901" } };
            })
        };

        identityService = new IdentityService(mockProvider, mockWalletService);
    });

    test("Debit-First pattern prevents double-spending under concurrency", async () => {
        // Trigger TWO simultaneous verification requests
        const requestA = identityService.verifyNin(userId, "11111111111");
        const requestB = identityService.verifyNin(userId, "22222222222");

        // Wait for both to complete
        const results = await Promise.allSettled([requestA, requestB]);

        // RESULTS ANALYSIS
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failureCount = results.filter(r => r.status === 'rejected').length;

        // Verify that only ONE succeeded
        expect(successCount).toBe(1);
        expect(failureCount).toBe(1);

        // Verify that the provider was only called ONCE
        // (In the vulnerable version, it would have been called TWICE because debit happened AFTER)
        expect(mockProvider.fetchByNin).toHaveBeenCalledTimes(successCount);

        // Verify that the total wallet balance is correct (150 - 100 = 50)
        const finalBalance = await mockWalletService.getBalance(userId);
        expect(finalBalance).toBe(50);
        
        console.log("✅ Security Test Passed: Concurrency Race Condition Blocked.");
    });

    test("Refund is issued if provider call fails", async () => {
        // Mock provider to fail
        mockProvider.fetchByNin.mockImplementationOnce(async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            return { success: false, error: "Identity not found" };
        });

        const initialBalance = await mockWalletService.getBalance(userId);

        // Call verification (should fail and refund)
        try {
            await identityService.verifyNin(userId, "99999999999");
        } catch (e) {
            // Expected
        }

        // Verify refund was called
        expect(mockWalletService.refundWallet).toHaveBeenCalledWith(userId, fee, 'NIN_VERIFY');

        // Verify balance is restored
        const finalBalance = await mockWalletService.getBalance(userId);
        expect(finalBalance).toBe(initialBalance);
        
        console.log("✅ Security Test Passed: Rollback/Refund logic verified.");
    });
});
