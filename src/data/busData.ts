import { BusStop, BusService, RideCalculation, ServiceDirection } from '../types';

/**
 * Assumed average bus speed in km/h for Singapore urban roads with bus stops & traffic.
 * Used for estimating ride durations when live arrival timings are not available.
 */
export const AVERAGE_BUS_SPEED_KMH = 18;

/**
 * Assumed scheduled wait headway in minutes when no live bus arrival time is available.
 */
export const ASSUMED_SCHEDULED_HEADWAY_MIN = 7;

/**
 * Master catalog of bus stops across Singapore.
 * 44 bus stops with real-world Singapore codes, landmarks, and roads.
 */
export const BUS_STOPS: BusStop[] = [
  { code: '54261', name: 'Ang Mo Kio Stn', road: 'Ang Mo Kio Ave 8', services: ['74', '166', '851'] },
  { code: '54269', name: 'Opp Ang Mo Kio Stn', road: 'Ang Mo Kio Ave 8', services: ['74', '166', '851'] },
  { code: '54199', name: 'Blk 424', road: 'Ang Mo Kio Ave 3', services: ['74', '166'] },
  { code: '54191', name: 'Opp Blk 424', road: 'Ang Mo Kio Ave 3', services: ['74', '166'] },
  { code: '53009', name: 'Bishan Int', road: 'Bishan Pl', services: ['74', '166', '851'] },
  { code: '53231', name: 'Raffles Institution', road: 'Bishan Rd', services: ['74', '166', '851'] },
  { code: '53239', name: 'Opp Raffles Institution', road: 'Bishan Rd', services: ['74', '166', '851'] },
  { code: '52009', name: 'Toa Payoh Int', road: 'Lor 6 Toa Payoh', services: ['65', '74', '174'] },
  { code: '52181', name: 'Opp Toa Payoh Swim Cplx', road: 'Lor 6 Toa Payoh', services: ['65', '74', '174'] },
  { code: '52189', name: 'Toa Payoh Swim Cplx', road: 'Lor 6 Toa Payoh', services: ['65', '74', '174'] },
  { code: '50031', name: 'Novena Stn', road: 'Thomson Rd', services: ['65', '166', '174', '851'] },
  { code: '50038', name: 'Opp Novena Stn', road: 'Thomson Rd', services: ['65', '166', '174', '851'] },
  { code: '09219', name: 'Newton Stn Exit A', road: 'Scotts Rd', services: ['74', '166', '851'] },
  { code: '09211', name: 'Newton Stn Exit B', road: 'Scotts Rd', services: ['74', '166', '851'] },
  { code: '09048', name: 'Far East Plaza', road: 'Scotts Rd', services: ['74', '166', '174'] },
  { code: '09047', name: 'Royal Plaza On Scotts', road: 'Scotts Rd', services: ['74', '166', '174'] },
  { code: '09022', name: 'Orchard Stn / Tangs', road: 'Orchard Blvd', services: ['14', '65', '74', '166', '174'] },
  { code: '09023', name: 'Opp Orchard Stn', road: 'Orchard Turn', services: ['14', '65', '74', '166', '174'] },
  { code: '09037', name: 'Somerset Stn', road: 'Orchard Rd', services: ['14', '65', '174'] },
  { code: '09038', name: 'Opp Somerset Stn', road: 'Somerset Rd', services: ['14', '65', '174'] },
  { code: '08138', name: 'Dhoby Ghaut Stn', road: 'Orchard Rd', services: ['14', '65', '166', '174', '851'] },
  { code: '08137', name: 'Plaza Singapura', road: 'Orchard Rd', services: ['14', '65', '166', '174', '851'] },
  { code: '04111', name: 'Cathay Bldg', road: 'Bras Basah Rd', services: ['14', '174', '851'] },
  { code: '04121', name: 'SMU / Bras Basah Stn', road: 'Bras Basah Rd', services: ['14', '174', '851'] },
  { code: '04129', name: 'Opp SMU', road: 'Stamford Rd', services: ['14', '174', '851'] },
  { code: '01012', name: 'Hotel Rendezvous', road: 'Bras Basah Rd', services: ['14', '174', '851'] },
  { code: '04168', name: 'City Hall Stn Exit B', road: 'Nth Bridge Rd', services: ['14', '174'] },
  { code: '04167', name: 'Opp City Hall Stn', road: 'Coleman St', services: ['14', '174'] },
  { code: '04222', name: 'Clarke Quay Stn', road: 'Eu Tong Sen St', services: ['14', '166', '851'] },
  { code: '04229', name: 'Opp Clarke Quay Stn', road: 'New Bridge Rd', services: ['14', '166', '851'] },
  { code: '05013', name: 'Chinatown Stn Exit C', road: 'Eu Tong Sen St', services: ['65', '166', '174', '851'] },
  { code: '05019', name: 'Chinatown Stn Exit E', road: 'New Bridge Rd', services: ['65', '166', '174', '851'] },
  { code: '10018', name: 'Outram Pk Stn', road: 'New Bridge Rd', services: ['65', '174', '851'] },
  { code: '10017', name: 'Opp Outram Pk Stn', road: 'New Bridge Rd', services: ['65', '174', '851'] },
  { code: '10009', name: 'Bukit Merah Int', road: 'Bt Merah Central', services: ['851'] },
  { code: '14119', name: 'HarbourFront Stn / Vivocity', road: 'Telok Blangah Rd', services: ['65', '166'] },
  { code: '14111', name: 'Opp HarbourFront Stn', road: 'Telok Blangah Rd', services: ['65', '166'] },
  { code: '11379', name: 'Buona Vista Stn', road: 'Commonwealth Ave', services: ['14', '74', '166'] },
  { code: '11371', name: 'Opp Buona Vista Stn', road: 'Commonwealth Ave', services: ['14', '74', '166'] },
  { code: '19009', name: 'Clementi Int', road: 'Clementi Ave 3', services: ['14', '74', '166'] },
  { code: '19051', name: 'Blk 328', road: 'Clementi Ave 2', services: ['14', '74', '166'] },
  { code: '84009', name: 'Tampines Int', road: 'Tampines Ave 4', services: ['65'] },
  { code: '84221', name: 'Tampines Stn Exit B', road: 'Tampines Ave 4', services: ['65'] },
  { code: '84011', name: 'Bedok Int', road: 'Bedok Nth Dr', services: ['14', '65'] },
  { code: '84039', name: 'Bedok Stn Exit A', road: 'New Changi Rd', services: ['14', '65'] },
  { code: '64009', name: 'Hougang Central Int', road: 'Hougang Central', services: ['74', '174'] },
  { code: '64541', name: 'Hougang Plaza', road: 'Upper Serangoon Rd', services: ['74', '174'] },
  { code: '59009', name: 'Yishun Int', road: 'Yishun Ave 2', services: ['851'] },
  { code: '59079', name: 'Opp Yishun Stn', road: 'Yishun Ave 2', services: ['851'] }
];

/**
 * 6 bus services connecting Singapore neighborhoods.
 * - Services 14, 65, 166, 851 have live arrival times.
 * - Services 74 and 174 have EMPTY arrival times all the way along to trigger the estimated distance calculation.
 * Each direction contains >= 12 stops.
 */
export const BUS_SERVICES: BusService[] = [
  // -------------------------------------------------------------
  // Service 14: Bedok Int <-> Clementi Int (Has Live Times)
  // -------------------------------------------------------------
  {
    serviceNumber: '14',
    directions: [
      {
        directionId: 1,
        originName: 'Bedok Int',
        destinationName: 'Clementi Int',
        stops: [
          { stopCode: '84011', distanceKm: 0.0, arrivalMinutes: [2, 14] }, // Bedok Int
          { stopCode: '84039', distanceKm: 0.9, arrivalMinutes: [5, 17] }, // Bedok Stn Exit A
          { stopCode: '04111', distanceKm: 8.5, arrivalMinutes: [18, 30] }, // Cathay Bldg
          { stopCode: '04121', distanceKm: 9.1, arrivalMinutes: [20, 32] }, // SMU / Bras Basah
          { stopCode: '01012', distanceKm: 9.7, arrivalMinutes: [22, 34] }, // Hotel Rendezvous
          { stopCode: '08138', distanceKm: 10.4, arrivalMinutes: [24, 36] }, // Dhoby Ghaut Stn
          { stopCode: '09037', distanceKm: 11.2, arrivalMinutes: [27, 39] }, // Somerset Stn
          { stopCode: '09022', distanceKm: 12.3, arrivalMinutes: [30, 42] }, // Orchard Stn / Tangs
          { stopCode: '04168', distanceKm: 14.5, arrivalMinutes: [35, 47] }, // City Hall Stn Exit B
          { stopCode: '04222', distanceKm: 15.6, arrivalMinutes: [38, 50] }, // Clarke Quay Stn
          { stopCode: '11379', distanceKm: 21.0, arrivalMinutes: [49, 61] }, // Buona Vista Stn
          { stopCode: '19051', distanceKm: 23.2, arrivalMinutes: [54, 66] }, // Blk 328
          { stopCode: '19009', distanceKm: 24.8, arrivalMinutes: [58, 70] }  // Clementi Int
        ]
      },
      {
        directionId: 2,
        originName: 'Clementi Int',
        destinationName: 'Bedok Int',
        stops: [
          { stopCode: '19009', distanceKm: 0.0, arrivalMinutes: [3, 15] }, // Clementi Int
          { stopCode: '19051', distanceKm: 1.5, arrivalMinutes: [6, 18] }, // Blk 328
          { stopCode: '11371', distanceKm: 3.7, arrivalMinutes: [11, 23] }, // Opp Buona Vista
          { stopCode: '04229', distanceKm: 9.2, arrivalMinutes: [22, 34] }, // Opp Clarke Quay
          { stopCode: '04167', distanceKm: 10.3, arrivalMinutes: [25, 37] }, // Opp City Hall
          { stopCode: '04129', distanceKm: 11.0, arrivalMinutes: [27, 39] }, // Opp SMU
          { stopCode: '08137', distanceKm: 11.8, arrivalMinutes: [29, 41] }, // Plaza Singapura
          { stopCode: '09038', distanceKm: 12.6, arrivalMinutes: [32, 44] }, // Opp Somerset Stn
          { stopCode: '09023', distanceKm: 13.7, arrivalMinutes: [35, 47] }, // Opp Orchard Stn
          { stopCode: '01012', distanceKm: 15.1, arrivalMinutes: [39, 51] }, // Hotel Rendezvous
          { stopCode: '04111', distanceKm: 15.8, arrivalMinutes: [41, 53] }, // Cathay Bldg
          { stopCode: '84039', distanceKm: 23.9, arrivalMinutes: [55, 67] }, // Bedok Stn Exit A
          { stopCode: '84011', distanceKm: 24.8, arrivalMinutes: [58, 70] }  // Bedok Int
        ]
      }
    ]
  },

  // -------------------------------------------------------------
  // Service 65: Tampines Int <-> HarbourFront Int (Has Live Times)
  // -------------------------------------------------------------
  {
    serviceNumber: '65',
    directions: [
      {
        directionId: 1,
        originName: 'Tampines Int',
        destinationName: 'HarbourFront Int',
        stops: [
          { stopCode: '84009', distanceKm: 0.0, arrivalMinutes: [4, 16] }, // Tampines Int
          { stopCode: '84221', distanceKm: 0.8, arrivalMinutes: [6, 18] }, // Tampines Stn Exit B
          { stopCode: '84011', distanceKm: 5.2, arrivalMinutes: [16, 28] }, // Bedok Int
          { stopCode: '84039', distanceKm: 6.0, arrivalMinutes: [18, 30] }, // Bedok Stn Exit A
          { stopCode: '52009', distanceKm: 12.5, arrivalMinutes: [31, 43] }, // Toa Payoh Int
          { stopCode: '52181', distanceKm: 13.4, arrivalMinutes: [33, 45] }, // Opp Toa Payoh Swim
          { stopCode: '50031', distanceKm: 15.8, arrivalMinutes: [38, 50] }, // Novena Stn
          { stopCode: '09022', distanceKm: 18.2, arrivalMinutes: [44, 56] }, // Orchard Stn / Tangs
          { stopCode: '09037', distanceKm: 19.3, arrivalMinutes: [47, 59] }, // Somerset Stn
          { stopCode: '08138', distanceKm: 20.4, arrivalMinutes: [50, 62] }, // Dhoby Ghaut Stn
          { stopCode: '05013', distanceKm: 22.0, arrivalMinutes: [54, 66] }, // Chinatown Stn Exit C
          { stopCode: '10018', distanceKm: 23.1, arrivalMinutes: [57, 69] }, // Outram Pk Stn
          { stopCode: '14119', distanceKm: 26.5, arrivalMinutes: [64, 76] }  // HarbourFront Stn
        ]
      },
      {
        directionId: 2,
        originName: 'HarbourFront Int',
        destinationName: 'Tampines Int',
        stops: [
          { stopCode: '14119', distanceKm: 0.0, arrivalMinutes: [1, 13] }, // HarbourFront Stn
          { stopCode: '14111', distanceKm: 0.7, arrivalMinutes: [3, 15] }, // Opp HarbourFront Stn
          { stopCode: '10017', distanceKm: 3.4, arrivalMinutes: [9, 21] }, // Opp Outram Pk Stn
          { stopCode: '05019', distanceKm: 4.5, arrivalMinutes: [12, 24] }, // Chinatown Stn Exit E
          { stopCode: '08137', distanceKm: 6.1, arrivalMinutes: [16, 28] }, // Plaza Singapura
          { stopCode: '09038', distanceKm: 7.2, arrivalMinutes: [19, 31] }, // Opp Somerset Stn
          { stopCode: '09023', distanceKm: 8.3, arrivalMinutes: [22, 34] }, // Opp Orchard Stn
          { stopCode: '50038', distanceKm: 10.7, arrivalMinutes: [28, 40] }, // Opp Novena Stn
          { stopCode: '52189', distanceKm: 13.1, arrivalMinutes: [33, 45] }, // Toa Payoh Swim Cplx
          { stopCode: '52009', distanceKm: 14.0, arrivalMinutes: [35, 47] }, // Toa Payoh Int
          { stopCode: '84039', distanceKm: 20.5, arrivalMinutes: [48, 60] }, // Bedok Stn Exit A
          { stopCode: '84011', distanceKm: 21.3, arrivalMinutes: [50, 62] }, // Bedok Int
          { stopCode: '84221', distanceKm: 25.7, arrivalMinutes: [59, 71] }, // Tampines Stn Exit B
          { stopCode: '84009', distanceKm: 26.5, arrivalMinutes: [61, 73] }  // Tampines Int
        ]
      }
    ]
  },

  // -------------------------------------------------------------
  // Service 166: Ang Mo Kio Int <-> Clementi Int (Has Live Times)
  // -------------------------------------------------------------
  {
    serviceNumber: '166',
    directions: [
      {
        directionId: 1,
        originName: 'Ang Mo Kio Int',
        destinationName: 'Clementi Int',
        stops: [
          { stopCode: '54261', distanceKm: 0.0, arrivalMinutes: [4, 18] }, // Ang Mo Kio Stn
          { stopCode: '54199', distanceKm: 0.9, arrivalMinutes: [6, 20] }, // Blk 424
          { stopCode: '53009', distanceKm: 3.4, arrivalMinutes: [12, 26] }, // Bishan Int
          { stopCode: '53231', distanceKm: 4.5, arrivalMinutes: [15, 29] }, // Raffles Institution
          { stopCode: '50031', distanceKm: 8.2, arrivalMinutes: [23, 37] }, // Novena Stn
          { stopCode: '09219', distanceKm: 9.6, arrivalMinutes: [26, 40] }, // Newton Stn Exit A
          { stopCode: '09048', distanceKm: 10.7, arrivalMinutes: [29, 43] }, // Far East Plaza
          { stopCode: '09022', distanceKm: 11.5, arrivalMinutes: [31, 45] }, // Orchard Stn / Tangs
          { stopCode: '08138', distanceKm: 13.0, arrivalMinutes: [35, 49] }, // Dhoby Ghaut Stn
          { stopCode: '04222', distanceKm: 14.8, arrivalMinutes: [40, 54] }, // Clarke Quay Stn
          { stopCode: '05013', distanceKm: 15.6, arrivalMinutes: [42, 56] }, // Chinatown Stn Exit C
          { stopCode: '14119', distanceKm: 19.5, arrivalMinutes: [51, 65] }, // HarbourFront Stn
          { stopCode: '11379', distanceKm: 24.2, arrivalMinutes: [61, 75] }, // Buona Vista Stn
          { stopCode: '19051', distanceKm: 26.3, arrivalMinutes: [66, 80] }, // Blk 328
          { stopCode: '19009', distanceKm: 27.8, arrivalMinutes: [70, 84] }  // Clementi Int
        ]
      },
      {
        directionId: 2,
        originName: 'Clementi Int',
        destinationName: 'Ang Mo Kio Int',
        stops: [
          { stopCode: '19009', distanceKm: 0.0, arrivalMinutes: [5, 19] }, // Clementi Int
          { stopCode: '19051', distanceKm: 1.5, arrivalMinutes: [9, 23] }, // Blk 328
          { stopCode: '11371', distanceKm: 3.6, arrivalMinutes: [14, 28] }, // Opp Buona Vista Stn
          { stopCode: '14111', distanceKm: 8.3, arrivalMinutes: [24, 38] }, // Opp HarbourFront Stn
          { stopCode: '05019', distanceKm: 12.2, arrivalMinutes: [33, 47] }, // Chinatown Stn Exit E
          { stopCode: '04229', distanceKm: 13.0, arrivalMinutes: [35, 49] }, // Opp Clarke Quay Stn
          { stopCode: '08137', distanceKm: 14.8, arrivalMinutes: [40, 54] }, // Plaza Singapura
          { stopCode: '09023', distanceKm: 16.3, arrivalMinutes: [44, 58] }, // Opp Orchard Stn
          { stopCode: '09047', distanceKm: 17.1, arrivalMinutes: [46, 60] }, // Royal Plaza On Scotts
          { stopCode: '09211', distanceKm: 18.2, arrivalMinutes: [49, 63] }, // Newton Stn Exit B
          { stopCode: '50038', distanceKm: 19.6, arrivalMinutes: [52, 66] }, // Opp Novena Stn
          { stopCode: '53239', distanceKm: 23.3, arrivalMinutes: [60, 74] }, // Opp Raffles Institution
          { stopCode: '53009', distanceKm: 24.4, arrivalMinutes: [63, 77] }, // Bishan Int
          { stopCode: '54191', distanceKm: 26.9, arrivalMinutes: [68, 82] }, // Opp Blk 424
          { stopCode: '54269', distanceKm: 27.8, arrivalMinutes: [71, 85] }  // Opp Ang Mo Kio Stn
        ]
      }
    ]
  },

  // -------------------------------------------------------------
  // Service 851: Yishun Int <-> Bukit Merah Int (Has Live Times)
  // -------------------------------------------------------------
  {
    serviceNumber: '851',
    directions: [
      {
        directionId: 1,
        originName: 'Yishun Int',
        destinationName: 'Bukit Merah Int',
        stops: [
          { stopCode: '59009', distanceKm: 0.0, arrivalMinutes: [2, 13] }, // Yishun Int
          { stopCode: '59079', distanceKm: 0.9, arrivalMinutes: [4, 15] }, // Opp Yishun Stn
          { stopCode: '54261', distanceKm: 7.2, arrivalMinutes: [18, 29] }, // Ang Mo Kio Stn
          { stopCode: '53009', distanceKm: 9.7, arrivalMinutes: [24, 35] }, // Bishan Int
          { stopCode: '53231', distanceKm: 10.8, arrivalMinutes: [26, 37] }, // Raffles Institution
          { stopCode: '50031', distanceKm: 14.5, arrivalMinutes: [34, 45] }, // Novena Stn
          { stopCode: '09219', distanceKm: 15.9, arrivalMinutes: [37, 48] }, // Newton Stn Exit A
          { stopCode: '08138', distanceKm: 17.8, arrivalMinutes: [42, 53] }, // Dhoby Ghaut Stn
          { stopCode: '04111', distanceKm: 18.5, arrivalMinutes: [44, 55] }, // Cathay Bldg
          { stopCode: '04121', distanceKm: 19.1, arrivalMinutes: [46, 57] }, // SMU / Bras Basah
          { stopCode: '04222', distanceKm: 20.3, arrivalMinutes: [49, 60] }, // Clarke Quay Stn
          { stopCode: '05013', distanceKm: 21.1, arrivalMinutes: [51, 62] }, // Chinatown Stn Exit C
          { stopCode: '10018', distanceKm: 22.2, arrivalMinutes: [54, 65] }, // Outram Pk Stn
          { stopCode: '10009', distanceKm: 24.8, arrivalMinutes: [60, 71] }  // Bukit Merah Int
        ]
      },
      {
        directionId: 2,
        originName: 'Bukit Merah Int',
        destinationName: 'Yishun Int',
        stops: [
          { stopCode: '10009', distanceKm: 0.0, arrivalMinutes: [3, 15] }, // Bukit Merah Int
          { stopCode: '10017', distanceKm: 2.6, arrivalMinutes: [9, 21] }, // Opp Outram Pk Stn
          { stopCode: '05019', distanceKm: 3.7, arrivalMinutes: [12, 24] }, // Chinatown Stn Exit E
          { stopCode: '04229', distanceKm: 4.5, arrivalMinutes: [14, 26] }, // Opp Clarke Quay Stn
          { stopCode: '04129', distanceKm: 5.7, arrivalMinutes: [17, 29] }, // Opp SMU
          { stopCode: '01012', distanceKm: 6.3, arrivalMinutes: [19, 31] }, // Hotel Rendezvous
          { stopCode: '08137', distanceKm: 7.0, arrivalMinutes: [21, 33] }, // Plaza Singapura
          { stopCode: '09211', distanceKm: 8.9, arrivalMinutes: [26, 38] }, // Newton Stn Exit B
          { stopCode: '50038', distanceKm: 10.3, arrivalMinutes: [29, 41] }, // Opp Novena Stn
          { stopCode: '53239', distanceKm: 14.0, arrivalMinutes: [37, 49] }, // Opp Raffles Institution
          { stopCode: '53009', distanceKm: 15.1, arrivalMinutes: [39, 51] }, // Bishan Int
          { stopCode: '54269', distanceKm: 17.6, arrivalMinutes: [45, 57] }, // Opp Ang Mo Kio Stn
          { stopCode: '59079', distanceKm: 23.9, arrivalMinutes: [59, 71] }, // Opp Yishun Stn
          { stopCode: '59009', distanceKm: 24.8, arrivalMinutes: [62, 74] }  // Yishun Int
        ]
      }
    ]
  },

  // -------------------------------------------------------------
  // Service 74: Hougang Central <-> Buona Vista Ter
  // **EMPTY ARRIVAL TIMES all the way along (triggers distance calculation)**
  // -------------------------------------------------------------
  {
    serviceNumber: '74',
    directions: [
      {
        directionId: 1,
        originName: 'Hougang Central Int',
        destinationName: 'Buona Vista Ter',
        stops: [
          { stopCode: '64009', distanceKm: 0.0, arrivalMinutes: [] }, // Hougang Central Int
          { stopCode: '64541', distanceKm: 1.1, arrivalMinutes: [] }, // Hougang Plaza
          { stopCode: '54199', distanceKm: 4.8, arrivalMinutes: [] }, // Blk 424
          { stopCode: '54261', distanceKm: 5.7, arrivalMinutes: [] }, // Ang Mo Kio Stn
          { stopCode: '53009', distanceKm: 8.2, arrivalMinutes: [] }, // Bishan Int
          { stopCode: '53231', distanceKm: 9.3, arrivalMinutes: [] }, // Raffles Institution
          { stopCode: '52009', distanceKm: 12.0, arrivalMinutes: [] }, // Toa Payoh Int
          { stopCode: '52181', distanceKm: 12.9, arrivalMinutes: [] }, // Opp Toa Payoh Swim
          { stopCode: '09219', distanceKm: 16.5, arrivalMinutes: [] }, // Newton Stn Exit A
          { stopCode: '09048', distanceKm: 17.6, arrivalMinutes: [] }, // Far East Plaza
          { stopCode: '09022', distanceKm: 18.4, arrivalMinutes: [] }, // Orchard Stn / Tangs
          { stopCode: '11379', distanceKm: 24.1, arrivalMinutes: [] }, // Buona Vista Stn
          { stopCode: '19051', distanceKm: 26.2, arrivalMinutes: [] }  // Blk 328
        ]
      },
      {
        directionId: 2,
        originName: 'Buona Vista Ter',
        destinationName: 'Hougang Central Int',
        stops: [
          { stopCode: '19051', distanceKm: 0.0, arrivalMinutes: [] }, // Blk 328
          { stopCode: '11371', distanceKm: 2.1, arrivalMinutes: [] }, // Opp Buona Vista Stn
          { stopCode: '09023', distanceKm: 7.8, arrivalMinutes: [] }, // Opp Orchard Stn
          { stopCode: '09047', distanceKm: 8.6, arrivalMinutes: [] }, // Royal Plaza On Scotts
          { stopCode: '09211', distanceKm: 9.7, arrivalMinutes: [] }, // Newton Stn Exit B
          { stopCode: '52189', distanceKm: 13.3, arrivalMinutes: [] }, // Toa Payoh Swim Cplx
          { stopCode: '52009', distanceKm: 14.2, arrivalMinutes: [] }, // Toa Payoh Int
          { stopCode: '53239', distanceKm: 16.9, arrivalMinutes: [] }, // Opp Raffles Institution
          { stopCode: '53009', distanceKm: 18.0, arrivalMinutes: [] }, // Bishan Int
          { stopCode: '54269', distanceKm: 20.5, arrivalMinutes: [] }, // Opp Ang Mo Kio Stn
          { stopCode: '54191', distanceKm: 21.4, arrivalMinutes: [] }, // Opp Blk 424
          { stopCode: '64541', distanceKm: 25.1, arrivalMinutes: [] }, // Hougang Plaza
          { stopCode: '64009', distanceKm: 26.2, arrivalMinutes: [] }  // Hougang Central Int
        ]
      }
    ]
  },

  // -------------------------------------------------------------
  // Service 174: Hougang Central <-> New Bridge Rd Ter
  // **EMPTY ARRIVAL TIMES all the way along (triggers distance calculation)**
  // -------------------------------------------------------------
  {
    serviceNumber: '174',
    directions: [
      {
        directionId: 1,
        originName: 'Hougang Central Int',
        destinationName: 'New Bridge Rd Ter',
        stops: [
          { stopCode: '64009', distanceKm: 0.0, arrivalMinutes: [] }, // Hougang Central Int
          { stopCode: '64541', distanceKm: 1.1, arrivalMinutes: [] }, // Hougang Plaza
          { stopCode: '52009', distanceKm: 8.5, arrivalMinutes: [] }, // Toa Payoh Int
          { stopCode: '52181', distanceKm: 9.4, arrivalMinutes: [] }, // Opp Toa Payoh Swim
          { stopCode: '50031', distanceKm: 11.8, arrivalMinutes: [] }, // Novena Stn
          { stopCode: '09048', distanceKm: 13.7, arrivalMinutes: [] }, // Far East Plaza
          { stopCode: '09022', distanceKm: 14.5, arrivalMinutes: [] }, // Orchard Stn / Tangs
          { stopCode: '09037', distanceKm: 15.6, arrivalMinutes: [] }, // Somerset Stn
          { stopCode: '08138', distanceKm: 16.7, arrivalMinutes: [] }, // Dhoby Ghaut Stn
          { stopCode: '04111', distanceKm: 17.4, arrivalMinutes: [] }, // Cathay Bldg
          { stopCode: '04121', distanceKm: 18.0, arrivalMinutes: [] }, // SMU / Bras Basah
          { stopCode: '04168', distanceKm: 19.3, arrivalMinutes: [] }, // City Hall Stn Exit B
          { stopCode: '05013', distanceKm: 21.0, arrivalMinutes: [] }, // Chinatown Stn Exit C
          { stopCode: '10018', distanceKm: 22.1, arrivalMinutes: [] }  // Outram Pk Stn
        ]
      },
      {
        directionId: 2,
        originName: 'New Bridge Rd Ter',
        destinationName: 'Hougang Central Int',
        stops: [
          { stopCode: '10017', distanceKm: 0.0, arrivalMinutes: [] }, // Opp Outram Pk Stn
          { stopCode: '05019', distanceKm: 1.1, arrivalMinutes: [] }, // Chinatown Stn Exit E
          { stopCode: '04167', distanceKm: 2.8, arrivalMinutes: [] }, // Opp City Hall Stn
          { stopCode: '04129', distanceKm: 4.1, arrivalMinutes: [] }, // Opp SMU
          { stopCode: '01012', distanceKm: 4.7, arrivalMinutes: [] }, // Hotel Rendezvous
          { stopCode: '08137', distanceKm: 5.4, arrivalMinutes: [] }, // Plaza Singapura
          { stopCode: '09038', distanceKm: 6.5, arrivalMinutes: [] }, // Opp Somerset Stn
          { stopCode: '09023', distanceKm: 7.6, arrivalMinutes: [] }, // Opp Orchard Stn
          { stopCode: '09047', distanceKm: 8.4, arrivalMinutes: [] }, // Royal Plaza On Scotts
          { stopCode: '50038', distanceKm: 10.3, arrivalMinutes: [] }, // Opp Novena Stn
          { stopCode: '52189', distanceKm: 12.7, arrivalMinutes: [] }, // Toa Payoh Swim Cplx
          { stopCode: '52009', distanceKm: 13.6, arrivalMinutes: [] }, // Toa Payoh Int
          { stopCode: '64541', distanceKm: 21.0, arrivalMinutes: [] }, // Hougang Plaza
          { stopCode: '64009', distanceKm: 22.1, arrivalMinutes: [] }  // Hougang Central Int
        ]
      }
    ]
  }
];

/**
 * Maps stop code to BusStop object for fast lookups.
 */
export const STOP_MAP = new Map<string, BusStop>(
  BUS_STOPS.map((stop) => [stop.code, stop])
);

/**
 * Format a Date object as 12-hour clock string, e.g. "9:14am" or "10:05pm".
 */
export function formatClockTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const minuteString = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${minuteString}${ampm}`;
}

/**
 * Computes ride duration, wait time, and clock arrival time between two stops on a route.
 * Strictly adheres to:
 * - "Do NOT store ride durations anywhere. Compute them:"
 * - "subtract one stop's arrival time from another's when both have times"
 * - "when they don't, subtract the two distances and divide by an assumed average bus speed"
 */
export function computeRideMetrics(
  serviceNumber: string,
  boardingStopCode: string,
  destinationStopCode: string,
  currentTimestamp: number = Date.now(),
  liveBoardingMinutes?: number | null,
  liveDestinationMinutes?: number | null
): { calculation: RideCalculation; direction: ServiceDirection } | null {
  const service = BUS_SERVICES.find((s) => s.serviceNumber === serviceNumber);
  if (!service) return null;

  // Find which direction contains boardingStopCode followed by destinationStopCode
  let matchedDirection: ServiceDirection | null = null;
  let bIndex = -1;
  let dIndex = -1;

  for (const dir of service.directions) {
    const b = dir.stops.findIndex((s) => s.stopCode === boardingStopCode);
    const d = dir.stops.findIndex((s) => s.stopCode === destinationStopCode);
    if (b !== -1 && d !== -1 && d > b) {
      matchedDirection = dir;
      bIndex = b;
      dIndex = d;
      break;
    }
  }

  // If destination is not downstream or not picked yet, return null
  if (!matchedDirection || bIndex === -1 || dIndex === -1 || dIndex <= bIndex) {
    return null;
  }

  const boardStop = matchedDirection.stops[bIndex];
  const destStop = matchedDirection.stops[dIndex];

  const distanceKm = Math.round((destStop.distanceKm - boardStop.distanceKm) * 10) / 10;

  // Check if live arrival times are provided and valid for both boarding and destination
  const hasLiveTimes =
    (liveBoardingMinutes !== undefined &&
      liveBoardingMinutes !== null &&
      liveDestinationMinutes !== undefined &&
      liveDestinationMinutes !== null &&
      liveDestinationMinutes >= liveBoardingMinutes) ||
    (liveBoardingMinutes === undefined &&
      boardStop.arrivalMinutes.length > 0 &&
      destStop.arrivalMinutes.length > 0);

  if (hasLiveTimes) {
    const minutesToBoarding =
      liveBoardingMinutes !== undefined && liveBoardingMinutes !== null
        ? liveBoardingMinutes
        : boardStop.arrivalMinutes[0];

    const destMinutes =
      liveDestinationMinutes !== undefined && liveDestinationMinutes !== null
        ? liveDestinationMinutes
        : destStop.arrivalMinutes[0];

    // Subtract one stop's arrival time from another's
    const rideDurationMinutes = Math.max(1, destMinutes - minutesToBoarding);

    // Destination arrival clock time = currentTime + dest arrival
    const arrivalDate = new Date(currentTimestamp + destMinutes * 60 * 1000);
    const arrivalClockTime = formatClockTime(arrivalDate);

    return {
      direction: matchedDirection,
      calculation: {
        hasLiveTiming: true,
        minutesToBoarding,
        rideDurationMinutes,
        arrivalClockTime,
        distanceKm,
        destinationStopCode,
        boardingStopCode,
      },
    };
  } else {
    // Distance based estimation:
    // Subtract two distances and divide by AVERAGE_BUS_SPEED_KMH
    const estimatedHours = distanceKm / AVERAGE_BUS_SPEED_KMH;
    const rideDurationMinutes = Math.max(1, Math.round(estimatedHours * 60));

    // Wait until boarding: if live boarding time is known use it, else fallback to schedule
    const minutesToBoarding =
      liveBoardingMinutes !== undefined && liveBoardingMinutes !== null
        ? liveBoardingMinutes
        : boardStop.arrivalMinutes.length > 0
        ? boardStop.arrivalMinutes[0]
        : ASSUMED_SCHEDULED_HEADWAY_MIN;

    const totalMinutesToDestination = minutesToBoarding + rideDurationMinutes;
    const arrivalDate = new Date(currentTimestamp + totalMinutesToDestination * 60 * 1000);
    const arrivalClockTime = formatClockTime(arrivalDate);

    return {
      direction: matchedDirection,
      calculation: {
        hasLiveTiming: false,
        minutesToBoarding,
        rideDurationMinutes,
        arrivalClockTime,
        distanceKm,
        destinationStopCode,
        boardingStopCode,
      },
    };
  }
}

/**
 * Helper to get the correct direction of a service that serves a boarding stop.
 */
export function getServiceDirectionForBoarding(
  serviceNumber: string,
  boardingStopCode: string
): ServiceDirection | null {
  const service = BUS_SERVICES.find((s) => s.serviceNumber === serviceNumber);
  if (!service) return null;

  for (const dir of service.directions) {
    const idx = dir.stops.findIndex((s) => s.stopCode === boardingStopCode);
    // Boarding stop must exist and not be the very last stop (so user can travel downstream)
    if (idx !== -1 && idx < dir.stops.length - 1) {
      return dir;
    }
  }

  // Fallback if it's the last stop of dir 1, check dir 2
  for (const dir of service.directions) {
    const idx = dir.stops.findIndex((s) => s.stopCode === boardingStopCode);
    if (idx !== -1) {
      return dir;
    }
  }

  return service.directions[0];
}
