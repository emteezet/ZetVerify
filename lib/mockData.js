export const mockUsers = [
    {
        type: 'NIN',
        nin: '11111111111',
        tracking_id: '7Y0OG2ZO003KUPG',
        bvn: null,
        firstName: 'CHUKWUMA',
        lastName: 'ADEBAYO',
        middleName: 'IBRAHIM',
        gender: 'Male',
        dob: '1990-05-15',
        phone: '08011111111',
        state: 'FCT',
        lga: 'Abuja Municipal',
        photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NINMock1',
        residence: 'No. 42 Independence Avenue, Garki, Abuja'
    },
    {
        type: 'NIN',
        nin: '22222222222',
        tracking_id: 'XYZ789TRACK001',
        bvn: null,
        firstName: 'NGOZI',
        lastName: 'OKONKWO',
        middleName: 'AMAKA',
        gender: 'Female',
        dob: '1988-07-22',
        phone: '08022222222',
        state: 'Anambra',
        lga: 'Awka South',
        photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NINMock2',
        residence: '15 Zik Avenue, Awka'
    },
    {
        type: 'BVN',
        nin: null,
        bvn: '33333333333',
        firstName: 'IBRAHIM',
        lastName: 'MOHAMMED',
        middleName: 'SULEIMAN',
        gender: 'Male',
        dob: '1995-11-08',
        phone: '08033333333',
        state: 'Kano',
        lga: 'Kano Municipal',
        photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BVNMock1',
        residence: '10 Ado Bayero Way, Kano'
    },
    {
        type: 'BVN',
        nin: null,
        bvn: '44444444444',
        firstName: 'FOLAKE',
        lastName: 'ADEYEMI',
        middleName: 'OLUWASEUN',
        gender: 'Female',
        dob: '1992-01-30',
        phone: '08044444444',
        state: 'Oyo',
        lga: 'Ibadan North',
        photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BVNMock2',
        residence: '20 Ring Road, Ibadan'
    },
    {
        type: 'DUAL',
        nin: '55555555555',
        bvn: '55555555555',
        firstName: 'EMEKA',
        lastName: 'NWANKWO',
        middleName: 'OBIORA',
        gender: 'Male',
        dob: '1985-05-14',
        phone: '08055555555',
        state: 'Enugu',
        lga: 'Enugu East',
        photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DualMock1',
        residence: '5 Agbani Road, Enugu'
    }
];

export const getMockByNin = (nin) => mockUsers.find(u => u.nin === nin);
export const getMockByBvn = (bvn) => mockUsers.find(u => u.bvn === bvn);
export const getMockByPhone = (phone) => mockUsers.find(u => u.phone === phone);
export const getMockByTrackingId = (trackingId) => mockUsers.find(u => u.tracking_id === trackingId);
export const getMockByDemography = (firstname, lastname, dob) => {
    return mockUsers.find(u => 
        u.firstName?.toLowerCase() === firstname?.toLowerCase() &&
        u.lastName?.toLowerCase() === lastname?.toLowerCase() &&
        u.dob === dob
    );
};
