import sampleLaptopImg from '../assets/images/sample_asset_laptop_1794898172404.jpg';
import samplePrinterImg from '../assets/images/sample_asset_printer_1794898172845.jpg';
import sampleAcImg from '../assets/images/sample_asset_ac_unit_1794898173857.jpg';
import type {
  AssetInspection,
  AssetRecord,
  AuditLog,
  CensusPeriod,
  CensusPeriodStatus,
  ConditionStatus,
  DashboardData,
  ExistenceStatus,
  ImportBatch,
  LocationNode,
  LocationType,
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceTicket,
  Role,
  RoleCode,
  UserAccount,
  VerificationStatus,
} from '../types.ts';

const STORAGE_KEY = 'assetin_client_store_v3';

interface StoredUser {
  id: number;
  name: string;
  employee_id: string;
  location_id: number;
  role_id: number;
  email: string;
  password: string;
  status: 'Aktif' | 'Nonaktif';
}

interface StoredAsset {
  id: number;
  asset_id: string;
  kib_code: string;
  register_number: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  serial_number: string;
  acquisition_year: number;
  acquisition_value: number;
  recorded_condition: ConditionStatus;
  recorded_location_id: number;
  official_status: string;
  qr_token: string;
  import_batch_id: number | null;
  created_at: string;
}

interface StoredInspection {
  id: number;
  asset_id: number;
  period_id: number;
  inspector_user_id: number;
  existence_status: ExistenceStatus;
  condition_status: ConditionStatus;
  actual_location_id: number;
  pic_name: string;
  photo_url: string | null;
  notes: string | null;
  koordinator_note: string | null;
  koordinator_reviewed_by: string | null;
  verification_status: VerificationStatus;
  verified_by_user_id: number | null;
  verified_at: string | null;
  rejection_reason: string | null;
  inspected_at: string;
}

interface StoredTicket {
  id: number;
  ticket_code: string;
  asset_id: number;
  reported_by_user_id: number;
  assigned_pic: string;
  issue_description: string;
  priority: MaintenancePriority;
  target_date: string;
  status: MaintenanceStatus;
  resolution_notes: string | null;
  repair_photo_url: string | null;
  created_at: string;
  updated_at: string;
}

interface StoredBatch {
  id: number;
  filename: string;
  imported_by_user_id: number;
  total_rows: number;
  inserted_rows: number;
  duplicate_rows: number;
  error_rows: number;
  column_mapping_json: string;
  status: string;
  notes: string | null;
  created_at: string;
}

interface StoredAuditLog {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: string;
  summary: string;
  details_json: string | null;
  created_at: string;
}

interface MockDatabase {
  roles: Role[];
  locations: LocationNode[];
  users: StoredUser[];
  census_periods: CensusPeriod[];
  import_batches: StoredBatch[];
  assets: StoredAsset[];
  asset_inspections: StoredInspection[];
  maintenance_tickets: StoredTicket[];
  audit_logs: StoredAuditLog[];
  sessions: Record<string, number>;
}

function nowTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function randomHex(bytesLen: number): string {
  const chars = '0123456789ABCDEF';
  let out = '';
  for (let i = 0; i < bytesLen * 2; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function createInitialDatabase(): MockDatabase {
  const roles: Role[] = [
    {
      id: 1,
      code: 'ADMIN_SISTEM',
      name: 'Admin Sistem',
      description:
        'Akses penuh konfigurasi sistem, manajemen akun, role, master lokasi, backup, dan audit log.',
      permissions: [
        'dashboard:view',
        'assets:view',
        'import:execute',
        'qrcode:manage',
        'scan:use',
        'census:submit',
        'verification:approve',
        'monitoring:view',
        'maintenance:manage',
        'locations:manage',
        'users:manage',
        'reports:export',
        'settings:manage',
      ],
    },
    {
      id: 2,
      code: 'PENGURUS_BARANG',
      name: 'Pengurus Barang Kecamatan',
      description:
        'Import Excel KIB B, generate & cetak QR Code, penugasan periode sensus, verifikasi/approval hasil sensus, manajemen tiket pemeliharaan, ekspor laporan.',
      permissions: [
        'dashboard:view',
        'assets:view',
        'import:execute',
        'qrcode:manage',
        'scan:use',
        'census:submit',
        'verification:approve',
        'monitoring:view',
        'maintenance:manage',
        'reports:export',
        'settings:periods',
      ],
    },
    {
      id: 3,
      code: 'PETUGAS_KECAMATAN',
      name: 'Petugas Kecamatan',
      description:
        'Melakukan scan QR dan pemeriksaan/sensus fisik aset di lingkungan kantor Kecamatan Taman.',
      permissions: [
        'dashboard:view',
        'assets:view',
        'scan:use',
        'census:submit',
        'monitoring:view',
        'maintenance:report',
      ],
    },
    {
      id: 4,
      code: 'PETUGAS_KELURAHAN',
      name: 'Petugas Kelurahan',
      description:
        'Melakukan scan QR dan sensus fisik terbatas pada wilayah kelurahannya sendiri.',
      permissions: [
        'dashboard:view',
        'assets:view',
        'scan:use',
        'census:submit',
        'monitoring:view',
        'maintenance:report',
      ],
    },
    {
      id: 5,
      code: 'KOORDINATOR_KELURAHAN',
      name: 'Koordinator Kelurahan',
      description:
        'Monitoring progres sensus dan review awal hasil pemeriksaan di kelurahan setempat.',
      permissions: [
        'dashboard:view',
        'assets:view',
        'scan:use',
        'census:submit',
        'verification:koordinator_review',
        'monitoring:view',
        'maintenance:report',
        'reports:export',
      ],
    },
    {
      id: 6,
      code: 'PIMPINAN_VIEWER',
      name: 'Pimpinan / Viewer',
      description:
        'Akses read-only untuk dashboard, grafik KPI, rekapitulasi, dan ekspor laporan tanpa izin edit.',
      permissions: ['dashboard:view', 'assets:view', 'monitoring:view', 'reports:export'],
    },
  ];

  // Kecamatan Taman + 8 Kelurahan: Sepanjang, Bebekan, Wonocolo, Kalijaten, Kuranji, Geluran, Kramatjegu, Taman
  const locations: LocationNode[] = [
    { id: 1, code: 'KEC-TMN', name: 'Kecamatan Taman', type: 'Kecamatan', parent_id: null },
    { id: 2, code: 'KEC-TMN-R01', name: 'Ruang Camat', type: 'Ruang', parent_id: 1 },
    { id: 3, code: 'KEC-TMN-R02', name: 'Ruang Pelayanan Terpadu (PATEN)', type: 'Ruang', parent_id: 1 },
    { id: 4, code: 'KEC-TMN-R03', name: 'Ruang Sekretariat & Arsip', type: 'Ruang', parent_id: 1 },
    { id: 5, code: 'KEC-TMN-R04', name: 'Aula Pertemuan Kecamatan', type: 'Ruang', parent_id: 1 },

    // Kelurahan Taman (id 6, rooms 7,8)
    { id: 6, code: 'KEL-TMN', name: 'Kelurahan Taman', type: 'Kelurahan', parent_id: 1 },
    { id: 7, code: 'KEL-TMN-R01', name: 'Ruang Pelayanan Kelurahan Taman', type: 'Ruang', parent_id: 6 },
    { id: 8, code: 'KEL-TMN-R02', name: 'Ruang Lurah & Staf Kelurahan Taman', type: 'Ruang', parent_id: 6 },

    // Kelurahan Kalijaten (id 9, rooms 10,11)
    { id: 9, code: 'KEL-KLJ', name: 'Kelurahan Kalijaten', type: 'Kelurahan', parent_id: 1 },
    { id: 10, code: 'KEL-KLJ-R01', name: 'Ruang Pelayanan Kelurahan Kalijaten', type: 'Ruang', parent_id: 9 },
    { id: 11, code: 'KEL-KLJ-R02', name: 'Ruang Lurah & Staf Kelurahan Kalijaten', type: 'Ruang', parent_id: 9 },

    // Kelurahan Wonocolo (id 12, rooms 13,14)
    { id: 12, code: 'KEL-WNC', name: 'Kelurahan Wonocolo', type: 'Kelurahan', parent_id: 1 },
    { id: 13, code: 'KEL-WNC-R01', name: 'Ruang Pelayanan Kelurahan Wonocolo', type: 'Ruang', parent_id: 12 },
    { id: 14, code: 'KEL-WNC-R02', name: 'Ruang Lurah & Staf Kelurahan Wonocolo', type: 'Ruang', parent_id: 12 },

    // Kelurahan Geluran (id 15, rooms 16,17)
    { id: 15, code: 'KEL-GLR', name: 'Kelurahan Geluran', type: 'Kelurahan', parent_id: 1 },
    { id: 16, code: 'KEL-GLR-R01', name: 'Ruang Pelayanan Kelurahan Geluran', type: 'Ruang', parent_id: 15 },
    { id: 17, code: 'KEL-GLR-R02', name: 'Ruang Lurah & Staf Kelurahan Geluran', type: 'Ruang', parent_id: 15 },

    // Kelurahan Kramatjegu (id 18, rooms 19,20)
    { id: 18, code: 'KEL-KMJ', name: 'Kelurahan Kramatjegu', type: 'Kelurahan', parent_id: 1 },
    { id: 19, code: 'KEL-KMJ-R01', name: 'Ruang Pelayanan Kelurahan Kramatjegu', type: 'Ruang', parent_id: 18 },
    { id: 20, code: 'KEL-KMJ-R02', name: 'Ruang Lurah & Staf Kelurahan Kramatjegu', type: 'Ruang', parent_id: 18 },

    // Kelurahan Sepanjang (id 21, rooms 22,23)
    { id: 21, code: 'KEL-SPJ', name: 'Kelurahan Sepanjang', type: 'Kelurahan', parent_id: 1 },
    { id: 22, code: 'KEL-SPJ-R01', name: 'Ruang Pelayanan Kelurahan Sepanjang', type: 'Ruang', parent_id: 21 },
    { id: 23, code: 'KEL-SPJ-R02', name: 'Ruang Lurah & Staf Kelurahan Sepanjang', type: 'Ruang', parent_id: 21 },

    // Kelurahan Kuranji (id 24, rooms 25,26)
    { id: 24, code: 'KEL-KRJ', name: 'Kelurahan Kuranji', type: 'Kelurahan', parent_id: 1 },
    { id: 25, code: 'KEL-KRJ-R01', name: 'Ruang Pelayanan Kelurahan Kuranji', type: 'Ruang', parent_id: 24 },
    { id: 26, code: 'KEL-KRJ-R02', name: 'Ruang Lurah & Staf Kelurahan Kuranji', type: 'Ruang', parent_id: 24 },

    // Kelurahan Bebekan (id 27, rooms 28,29)
    { id: 27, code: 'KEL-BBK', name: 'Kelurahan Bebekan', type: 'Kelurahan', parent_id: 1 },
    { id: 28, code: 'KEL-BBK-R01', name: 'Ruang Pelayanan Kelurahan Bebekan', type: 'Ruang', parent_id: 27 },
    { id: 29, code: 'KEL-BBK-R02', name: 'Ruang Lurah & Staf Kelurahan Bebekan', type: 'Ruang', parent_id: 27 },
  ];

  // Users: Kecamatan Taman (Rizka Aprilia) + Pengurus Barang + Petugas Kecamatan + 8 Petugas Kelurahan + Koordinator + Pimpinan
  const users: StoredUser[] = [
    {
      id: 1,
      name: 'Rizka Aprilia',
      employee_id: '199004122014022001',
      location_id: 1,
      role_id: 1,
      email: 'rizka.aprilia@taman.assetin.id',
      password: 'assetin2026',
      status: 'Aktif',
    },
    {
      id: 2,
      name: 'Siti Rahmawati, S.E.',
      employee_id: '198409212009022007',
      location_id: 1,
      role_id: 2,
      email: 'pengurus.barang@taman.assetin.id',
      password: 'assetin2026',
      status: 'Aktif',
    },
    {
      id: 3,
      name: 'Dimas Pratama, A.Md',
      employee_id: '199105152019031009',
      location_id: 1,
      role_id: 3,
      email: 'petugas.kec@taman.assetin.id',
      password: 'assetin2026',
      status: 'Aktif',
    },
    {
      id: 4,
      name: 'Rizkhe',
      employee_id: '199311082020122011',
      location_id: 6,
      role_id: 4,
      email: 'rizkhe.taman@taman.assetin.id',
      password: 'assetin2026',
      status: 'Aktif',
    },
    {
      id: 5,
      name: 'Aida',
      employee_id: '199403182020122014',
      location_id: 9,
      role_id: 4,
      email: 'aida.kalijaten@taman.assetin.id',
      password: 'assetin2026',
      status: 'Aktif',
    },
    {
      id: 6,
      name: 'Rizal',
      employee_id: '199207112019031005',
      location_id: 12,
      role_id: 4,
      email: 'rizal.wonocolo@taman.assetin.id',
      password: 'assetin2026',
      status: 'Aktif',
    },
    {
      id: 7,
      name: 'Yoga',
      employee_id: '199501222021021003',
      location_id: 15,
      role_id: 4,
      email: 'yoga.geluran@taman.assetin.id',
      password: 'assetin2026',
      status: 'Aktif',
    },
    {
      id: 8,
      name: 'Mariana',
      employee_id: '199108042018012006',
      location_id: 18,
      role_id: 4,
      email: 'mariana.kramatjegu@taman.assetin.id',
      password: 'assetin2026',
      status: 'Aktif',
    },
    {
      id: 9,
      name: 'Andik',
      employee_id: '198911192015041002',
      location_id: 21,
      role_id: 4,
      email: 'andik.sepanjang@taman.assetin.id',
      password: 'assetin2026',
      status: 'Aktif',
    },
    {
      id: 10,
      name: 'Laila',
      employee_id: '199406152021022008',
      location_id: 24,
      role_id: 4,
      email: 'laila.kuranji@taman.assetin.id',
      password: 'assetin2026',
      status: 'Aktif',
    },
    {
      id: 11,
      name: 'Riza',
      employee_id: '199302192020121004',
      location_id: 27,
      role_id: 4,
      email: 'riza.bebekan@taman.assetin.id',
      password: 'assetin2026',
      status: 'Aktif',
    },
    {
      id: 12,
      name: 'Drs. Bambang Sutrisno',
      employee_id: '197903142005011003',
      location_id: 6,
      role_id: 5,
      email: 'koordinator.taman@taman.assetin.id',
      password: 'assetin2026',
      status: 'Aktif',
    },
    {
      id: 13,
      name: 'H. Agus Prasetyo, S.STP, M.Si',
      employee_id: '197608171998101001',
      location_id: 1,
      role_id: 6,
      email: 'camat.taman@taman.assetin.id',
      password: 'assetin2026',
      status: 'Aktif',
    },
  ];

  const census_periods: CensusPeriod[] = [
    {
      id: 1,
      code: 'SENSUS-2026-S1',
      name: 'Sensus KIB B Semester I Tahun 2026',
      year: 2026,
      start_date: '2026-01-10',
      end_date: '2026-06-30',
      status: 'Ditutup',
      notes: 'Periode sensus awal semester I yang telah selesai direkonsiliasi.',
    },
    {
      id: 2,
      code: 'SENSUS-2026-S2',
      name: 'Sensus KIB B Semester II Tahun 2026',
      year: 2026,
      start_date: '2026-10-01',
      end_date: '2026-12-20',
      status: 'Aktif',
      notes: 'Sensus fisik menyeluruh Peralatan & Mesin Kecamatan Taman dan 8 Kelurahan.',
    },
  ];

  const import_batches: StoredBatch[] = [
    {
      id: 1,
      filename: 'KIB_B_KEC_TAMAN_2026_Q3.xlsx',
      imported_by_user_id: 2,
      total_rows: 8,
      inserted_rows: 8,
      duplicate_rows: 0,
      error_rows: 0,
      column_mapping_json: JSON.stringify({
        kib_code: 'Kode Barang',
        register_number: 'No. Register',
        name: 'Nama Barang',
        acquisition_year: 'Tahun Perolehan',
        acquisition_value: 'Harga Perolehan',
      }),
      status: 'Selesai',
      notes: 'Import data induk KIB B Kantor Kecamatan Taman.',
      created_at: '2026-10-02 09:15:00',
    },
    {
      id: 2,
      filename: 'KIB_B_8_KELURAHAN_TAMAN_2026.xlsx',
      imported_by_user_id: 2,
      total_rows: 20,
      inserted_rows: 20,
      duplicate_rows: 0,
      error_rows: 0,
      column_mapping_json: JSON.stringify({
        kib_code: 'Kode Barang',
        register_number: 'No. Register',
        name: 'Nama Barang',
        acquisition_year: 'Tahun Perolehan',
        acquisition_value: 'Harga Perolehan',
      }),
      status: 'Selesai',
      notes: 'Import data KIB B untuk 8 Kelurahan wilayah Kecamatan Taman.',
      created_at: '2026-10-04 14:20:00',
    },
  ];

  const rawAssetSeeds: Array<Omit<StoredAsset, 'id' | 'official_status' | 'qr_token' | 'created_at'>> = [
    // Kantor Kecamatan Taman (8 assets)
    { asset_id: 'AST-TMN-0001', kib_code: '1.3.2.10.01.02.002', register_number: 'REG-2023-0001', name: 'Laptop Kerja Operasional', category: 'Komputer & TI', brand: 'Dell', model: 'Latitude 5430', serial_number: 'DL5430-99182', acquisition_year: 2023, acquisition_value: 16500000, recorded_condition: 'Baik', recorded_location_id: 4, import_batch_id: 1 },
    { asset_id: 'AST-TMN-0002', kib_code: '1.3.2.10.02.03.003', register_number: 'REG-2021-0014', name: 'Printer Multifungsi Laser', category: 'Peralatan Kantor', brand: 'Fuji Xerox', model: 'DocuCentre S2110', serial_number: 'FX-2110-4481', acquisition_year: 2021, acquisition_value: 24800000, recorded_condition: 'Baik', recorded_location_id: 3, import_batch_id: 1 },
    { asset_id: 'AST-TMN-0003', kib_code: '1.3.2.05.02.04.001', register_number: 'REG-2020-0008', name: 'AC Split 2 PK Aula', category: 'Pendingin Ruangan', brand: 'LG', model: 'Hercules T18EMV', serial_number: 'LGAC-88201', acquisition_year: 2020, acquisition_value: 7850000, recorded_condition: 'Baik', recorded_location_id: 5, import_batch_id: 1 },
    { asset_id: 'AST-TMN-0004', kib_code: '1.3.2.02.01.02.003', register_number: 'REG-2022-0002', name: 'Kendaraan Dinas Roda 4', category: 'Kendaraan Dinas', brand: 'Toyota', model: 'Avanza 1.5 G MT', serial_number: 'MHFM1BA3JNK0192', acquisition_year: 2022, acquisition_value: 245000000, recorded_condition: 'Baik', recorded_location_id: 2, import_batch_id: 1 },
    { asset_id: 'AST-TMN-0005', kib_code: '1.3.2.10.01.02.001', register_number: 'REG-2024-0005', name: 'PC All-in-One Pelayanan', category: 'Komputer & TI', brand: 'HP', model: 'ProOne 440 G9', serial_number: 'HP440G9-3104', acquisition_year: 2024, acquisition_value: 14200000, recorded_condition: 'Baik', recorded_location_id: 3, import_batch_id: 1 },
    { asset_id: 'AST-TMN-0006', kib_code: '1.3.2.05.01.04.001', register_number: 'REG-2019-0022', name: 'Lemari Arsip Besi Pintu Kaca', category: 'Meubelair & Arsip', brand: 'Brother', model: 'B-304', serial_number: 'BRT-304-119', acquisition_year: 2019, acquisition_value: 3450000, recorded_condition: 'Baik', recorded_location_id: 4, import_batch_id: 1 },
    { asset_id: 'AST-TMN-0007', kib_code: '1.3.2.06.01.02.006', register_number: 'REG-2020-0031', name: 'Proyektor LCD Presentasi', category: 'Audio Visual', brand: 'Epson', model: 'EB-X500', serial_number: 'EPS-X500-7712', acquisition_year: 2020, acquisition_value: 6900000, recorded_condition: 'Rusak ringan', recorded_location_id: 5, import_batch_id: 1 },
    { asset_id: 'AST-TMN-0008', kib_code: '1.3.2.01.03.04.002', register_number: 'REG-2018-0011', name: 'Genset Silent 10 KVA', category: 'Peralatan Listrik', brand: 'Yanmar', model: 'YEG-10S', serial_number: 'YNM-10S-0891', acquisition_year: 2018, acquisition_value: 42000000, recorded_condition: 'Baik', recorded_location_id: 1, import_batch_id: 1 },

    // Kelurahan Taman (Petugas: Rizkhe)
    { asset_id: 'AST-KLT-0009', kib_code: '1.3.2.10.01.02.002', register_number: 'REG-2023-0041', name: 'Laptop Pelayanan Kependudukan', category: 'Komputer & TI', brand: 'Lenovo', model: 'ThinkPad E14 Gen 4', serial_number: 'LNV-E14-5521', acquisition_year: 2023, acquisition_value: 15800000, recorded_condition: 'Baik', recorded_location_id: 7, import_batch_id: 2 },
    { asset_id: 'AST-KLT-0010', kib_code: '1.3.2.10.02.03.003', register_number: 'REG-2022-0042', name: 'Printer Epson EcoTank L6290', category: 'Peralatan Kantor', brand: 'Epson', model: 'L6290 Wi-Fi', serial_number: 'EPS-6290-198', acquisition_year: 2022, acquisition_value: 6200000, recorded_condition: 'Baik', recorded_location_id: 7, import_batch_id: 2 },
    { asset_id: 'AST-KLT-0011', kib_code: '1.3.2.02.01.04.001', register_number: 'REG-2021-0043', name: 'Sepeda Motor Dinas Lurah', category: 'Kendaraan Dinas', brand: 'Honda', model: 'Supra X 125 FI', serial_number: 'MH1JB9128MK041', acquisition_year: 2021, acquisition_value: 19400000, recorded_condition: 'Baik', recorded_location_id: 8, import_batch_id: 2 },
    { asset_id: 'AST-KLT-0012', kib_code: '1.3.2.05.02.04.001', register_number: 'REG-2019-0044', name: 'AC Split 1.5 PK Ruang Lurah', category: 'Pendingin Ruangan', brand: 'Daikin', model: 'FTC35NV14', serial_number: 'DKN-35N-772', acquisition_year: 2019, acquisition_value: 6400000, recorded_condition: 'Baik', recorded_location_id: 8, import_batch_id: 2 },

    // Kelurahan Kalijaten (Petugas: Aida)
    { asset_id: 'AST-KLJ-0013', kib_code: '1.3.2.10.01.02.001', register_number: 'REG-2023-0051', name: 'PC Desktop Administrasi', category: 'Komputer & TI', brand: 'Asus', model: 'ExpertCenter D5', serial_number: 'ASU-D5-4412', acquisition_year: 2023, acquisition_value: 11900000, recorded_condition: 'Baik', recorded_location_id: 10, import_batch_id: 2 },
    { asset_id: 'AST-KLJ-0014', kib_code: '1.3.2.06.01.01.002', register_number: 'REG-2020-0052', name: 'Sound System Portable Rapat', category: 'Audio Visual', brand: 'TOA', model: 'ZW-G810CU', serial_number: 'TOA-810-904', acquisition_year: 2020, acquisition_value: 4800000, recorded_condition: 'Baik', recorded_location_id: 11, import_batch_id: 2 },

    // Kelurahan Wonocolo (Petugas: Rizal)
    { asset_id: 'AST-WNC-0015', kib_code: '1.3.2.10.01.02.002', register_number: 'REG-2022-0061', name: 'Laptop Bendahara Kelurahan', category: 'Komputer & TI', brand: 'HP', model: 'ProBook 440 G8', serial_number: 'HP440G8-882', acquisition_year: 2022, acquisition_value: 14900000, recorded_condition: 'Baik', recorded_location_id: 14, import_batch_id: 2 },
    { asset_id: 'AST-WNC-0016', kib_code: '1.3.2.05.01.01.005', register_number: 'REG-2019-0062', name: 'Brankas Tahan Api', category: 'Meubelair & Arsip', brand: 'ChubbSafes', model: 'Cobra Executive', serial_number: 'CHB-CE-204', acquisition_year: 2019, acquisition_value: 8700000, recorded_condition: 'Baik', recorded_location_id: 14, import_batch_id: 2 },

    // Kelurahan Geluran (Petugas: Yoga)
    { asset_id: 'AST-GLR-0017', kib_code: '1.3.2.10.02.03.005', register_number: 'REG-2023-0071', name: 'Mesin Antrian & Kiosk Informasi', category: 'Peralatan Kantor', brand: 'Zyrex', model: 'Kiosk-T21', serial_number: 'ZYR-K21-019', acquisition_year: 2023, acquisition_value: 18500000, recorded_condition: 'Baik', recorded_location_id: 16, import_batch_id: 2 },
    { asset_id: 'AST-GLR-0018', kib_code: '1.3.2.02.01.04.001', register_number: 'REG-2020-0072', name: 'Sepeda Motor Operasional Trantib', category: 'Kendaraan Dinas', brand: 'Yamaha', model: 'Vega Force DB', serial_number: 'MH3UE1120LJ092', acquisition_year: 2020, acquisition_value: 17200000, recorded_condition: 'Baik', recorded_location_id: 17, import_batch_id: 2 },

    // Kelurahan Kramatjegu (Petugas: Mariana)
    { asset_id: 'AST-KMJ-0019', kib_code: '1.3.2.10.01.02.001', register_number: 'REG-2021-0081', name: 'PC Desktop Operator SIAK', category: 'Komputer & TI', brand: 'Acer', model: 'Veriton M4665G', serial_number: 'ACR-M46-331', acquisition_year: 2021, acquisition_value: 10800000, recorded_condition: 'Baik', recorded_location_id: 19, import_batch_id: 2 },
    { asset_id: 'AST-KMJ-0020', kib_code: '1.3.2.05.02.04.001', register_number: 'REG-2018-0082', name: 'AC Split 1 PK Ruang Pelayanan', category: 'Pendingin Ruangan', brand: 'Panasonic', model: 'CS-YN9WKJ', serial_number: 'PNS-YN9-654', acquisition_year: 2018, acquisition_value: 4950000, recorded_condition: 'Rusak ringan', recorded_location_id: 19, import_batch_id: 2 },

    // Kelurahan Sepanjang (Petugas: Andik)
    { asset_id: 'AST-SPJ-0021', kib_code: '1.3.2.06.01.02.001', register_number: 'REG-2022-0091', name: 'Kamera Dokumentasi Kegiatan', category: 'Audio Visual', brand: 'Canon', model: 'EOS M50 Mark II', serial_number: 'CNN-M50-712', acquisition_year: 2022, acquisition_value: 11200000, recorded_condition: 'Baik', recorded_location_id: 23, import_batch_id: 2 },
    { asset_id: 'AST-SPJ-0022', kib_code: '1.3.2.10.02.03.003', register_number: 'REG-2023-0092', name: 'Scanner Dokumen Kecepatan Tinggi', category: 'Peralatan Kantor', brand: 'Fujitsu', model: 'fi-8150', serial_number: 'FJT-8150-309', acquisition_year: 2023, acquisition_value: 13400000, recorded_condition: 'Baik', recorded_location_id: 22, import_batch_id: 2 },

    // Kelurahan Kuranji (Petugas: Laila)
    { asset_id: 'AST-KRJ-0023', kib_code: '1.3.2.10.01.02.002', register_number: 'REG-2021-0101', name: 'Laptop Pengadministrasi Umum', category: 'Komputer & TI', brand: 'Asus', model: 'ExpertBook B1400', serial_number: 'ASU-B14-120', acquisition_year: 2021, acquisition_value: 12100000, recorded_condition: 'Baik', recorded_location_id: 25, import_batch_id: 2 },
    { asset_id: 'AST-KRJ-0024', kib_code: '1.3.2.05.01.02.003', register_number: 'REG-2017-0102', name: 'Meja Rapat Kayu Jati 12 Kursi', category: 'Meubelair & Arsip', brand: 'Lokal Koperasi', model: 'MR-240', serial_number: 'LK-MR240-08', acquisition_year: 2017, acquisition_value: 9600000, recorded_condition: 'Baik', recorded_location_id: 26, import_batch_id: 2 },

    // Kelurahan Bebekan (Petugas: Riza)
    { asset_id: 'AST-BBK-0025', kib_code: '1.3.2.10.01.02.001', register_number: 'REG-2024-0111', name: 'PC All-in-One Loket Layanan', category: 'Komputer & TI', brand: 'Lenovo', model: 'ThinkCentre Neo 30a', serial_number: 'LNV-NEO-981', acquisition_year: 2024, acquisition_value: 13700000, recorded_condition: 'Baik', recorded_location_id: 28, import_batch_id: 2 },
    { asset_id: 'AST-BBK-0026', kib_code: '1.3.2.10.02.03.003', register_number: 'REG-2020-0112', name: 'Printer Thermal & Inkjet', category: 'Peralatan Kantor', brand: 'Brother', model: 'DCP-T720DW', serial_number: 'BRT-T720-663', acquisition_year: 2020, acquisition_value: 4300000, recorded_condition: 'Baik', recorded_location_id: 28, import_batch_id: 2 },
    { asset_id: 'AST-BBK-0027', kib_code: '1.3.2.05.02.04.001', register_number: 'REG-2019-0113', name: 'AC Split 2 PK Balai Kelurahan', category: 'Pendingin Ruangan', brand: 'Sharp', model: 'AH-A18UCY', serial_number: 'SHP-18U-402', acquisition_year: 2019, acquisition_value: 7100000, recorded_condition: 'Baik', recorded_location_id: 29, import_batch_id: 2 },
    { asset_id: 'AST-BBK-0028', kib_code: '1.3.2.02.01.04.001', register_number: 'REG-2022-0114', name: 'Sepeda Motor Dinas Kelurahan', category: 'Kendaraan Dinas', brand: 'Honda', model: 'Revo Fit FI', serial_number: 'MH1JBK118NK209', acquisition_year: 2022, acquisition_value: 16400000, recorded_condition: 'Baik', recorded_location_id: 29, import_batch_id: 2 },
  ];

  const assets: StoredAsset[] = rawAssetSeeds.map((a, idx) => ({
    ...a,
    id: idx + 1,
    official_status: 'Tercatat KIB B',
    qr_token: `QR-${a.asset_id}-TMN26`,
    created_at: '2026-10-04 14:20:00',
  }));

  const asset_inspections: StoredInspection[] = [
    {
      id: 1,
      asset_id: 1,
      period_id: 2,
      inspector_user_id: 1,
      existence_status: 'Ditemukan',
      condition_status: 'Baik',
      actual_location_id: 4,
      pic_name: 'Rizka Aprilia',
      photo_url: sampleLaptopImg,
      notes: 'Label QR tertempel rapi di sudut chassis kanan bawah. Unit berfungsi normal.',
      koordinator_note: null,
      koordinator_reviewed_by: null,
      verification_status: 'Disetujui',
      verified_by_user_id: 2,
      verified_at: '2026-11-10 11:20:00',
      rejection_reason: null,
      inspected_at: '2026-11-10 09:45:00',
    },
    {
      id: 2,
      asset_id: 2,
      period_id: 2,
      inspector_user_id: 3,
      existence_status: 'Ditemukan',
      condition_status: 'Rusak ringan',
      actual_location_id: 3,
      pic_name: 'Siti Rahmawati, S.E.',
      photo_url: samplePrinterImg,
      notes: 'Baki kertas tray 2 sedikit macet saat penarikan dokumen. Sudah dibuatkan usulan servis.',
      koordinator_note: null,
      koordinator_reviewed_by: null,
      verification_status: 'Disetujui',
      verified_by_user_id: 2,
      verified_at: '2026-11-11 10:15:00',
      rejection_reason: null,
      inspected_at: '2026-11-11 08:30:00',
    },
    {
      id: 3,
      asset_id: 3,
      period_id: 2,
      inspector_user_id: 3,
      existence_status: 'Ditemukan',
      condition_status: 'Rusak berat',
      actual_location_id: 5,
      pic_name: 'Dimas Pratama, A.Md',
      photo_url: sampleAcImg,
      notes: 'Kompresor outdoor tidak menyala dan casing indoor berdebu tebal. Perlu pengecekan teknisi.',
      koordinator_note: null,
      koordinator_reviewed_by: null,
      verification_status: 'Menunggu Verifikasi',
      verified_by_user_id: null,
      verified_at: null,
      rejection_reason: null,
      inspected_at: '2026-11-14 14:10:00',
    },
    {
      id: 4,
      asset_id: 4,
      period_id: 2,
      inspector_user_id: 1,
      existence_status: 'Ditemukan',
      condition_status: 'Baik',
      actual_location_id: 2,
      pic_name: 'H. Agus Prasetyo, S.STP, M.Si',
      photo_url: null,
      notes: 'Nomor polisi W 1029 NP sesuai STNK, odometer 41.200 km.',
      koordinator_note: null,
      koordinator_reviewed_by: null,
      verification_status: 'Disetujui',
      verified_by_user_id: 2,
      verified_at: '2026-11-12 09:00:00',
      rejection_reason: null,
      inspected_at: '2026-11-12 08:20:00',
    },
    {
      id: 5,
      asset_id: 6,
      period_id: 2,
      inspector_user_id: 4,
      existence_status: 'Ditemukan',
      condition_status: 'Baik',
      actual_location_id: 7,
      pic_name: 'Rizkhe',
      photo_url: null,
      notes: 'Lemari arsip dipinjam sementara untuk penataan berkas Kelurahan Taman sejak September 2026.',
      koordinator_note:
        'Sudah dicek fisik di Ruang Pelayanan Kelurahan Taman, memang digunakan untuk arsip PBB.',
      koordinator_reviewed_by: 'Drs. Bambang Sutrisno',
      verification_status: 'Menunggu Verifikasi',
      verified_by_user_id: null,
      verified_at: null,
      rejection_reason: null,
      inspected_at: '2026-11-15 10:05:00',
    },
    {
      id: 6,
      asset_id: 7,
      period_id: 2,
      inspector_user_id: 3,
      existence_status: 'Dalam verifikasi',
      condition_status: 'Rusak ringan',
      actual_location_id: 5,
      pic_name: 'Rizka Aprilia',
      photo_url: null,
      notes:
        'Proyektor tidak berada di lemari Aula Kecamatan saat penyisiran awal; informasi staf sedang dipinjam rapat luar.',
      koordinator_note: null,
      koordinator_reviewed_by: null,
      verification_status: 'Menunggu Verifikasi',
      verified_by_user_id: null,
      verified_at: null,
      rejection_reason: null,
      inspected_at: '2026-11-15 15:40:00',
    },
    {
      id: 7,
      asset_id: 9,
      period_id: 2,
      inspector_user_id: 4,
      existence_status: 'Ditemukan',
      condition_status: 'Baik',
      actual_location_id: 7,
      pic_name: 'Rizkhe',
      photo_url: sampleLaptopImg,
      notes: 'Digunakan setiap hari di loket SIAK/Kependudukan Kelurahan Taman.',
      koordinator_note: 'Diverifikasi awal oleh Koordinator Kelurahan Taman.',
      koordinator_reviewed_by: 'Drs. Bambang Sutrisno',
      verification_status: 'Disetujui',
      verified_by_user_id: 2,
      verified_at: '2026-11-12 16:00:00',
      rejection_reason: null,
      inspected_at: '2026-11-12 13:30:00',
    },
    {
      id: 8,
      asset_id: 10,
      period_id: 2,
      inspector_user_id: 4,
      existence_status: 'Ditemukan',
      condition_status: 'Baik',
      actual_location_id: 7,
      pic_name: 'Rizkhe',
      photo_url: null,
      notes: 'Printer aktif untuk cetak surat keterangan warga.',
      koordinator_note: 'Sesuai kondisi fisik.',
      koordinator_reviewed_by: 'Drs. Bambang Sutrisno',
      verification_status: 'Menunggu Verifikasi',
      verified_by_user_id: null,
      verified_at: null,
      rejection_reason: null,
      inspected_at: '2026-11-15 11:20:00',
    },
    {
      id: 9,
      asset_id: 12,
      period_id: 2,
      inspector_user_id: 4,
      existence_status: 'Ditemukan',
      condition_status: 'Rusak ringan',
      actual_location_id: 8,
      pic_name: 'Rizkhe',
      photo_url: null,
      notes: 'AC kurang dingin, perlu isi freon.',
      koordinator_note: null,
      koordinator_reviewed_by: null,
      verification_status: 'Dikembalikan',
      verified_by_user_id: 2,
      verified_at: '2026-11-14 16:30:00',
      rejection_reason:
        'Mohon lampirkan foto bukti fisik unit AC dan tempelan stiker QR Code untuk validasi kondisi.',
      inspected_at: '2026-11-13 14:00:00',
    },
    {
      id: 10,
      asset_id: 13,
      period_id: 2,
      inspector_user_id: 5,
      existence_status: 'Ditemukan',
      condition_status: 'Baik',
      actual_location_id: 10,
      pic_name: 'Aida',
      photo_url: null,
      notes: 'Unit PC beroperasi normal di loket pelayanan Kalijaten.',
      koordinator_note: null,
      koordinator_reviewed_by: null,
      verification_status: 'Disetujui',
      verified_by_user_id: 2,
      verified_at: '2026-11-11 15:10:00',
      rejection_reason: null,
      inspected_at: '2026-11-11 14:50:00',
    },
    {
      id: 11,
      asset_id: 15,
      period_id: 2,
      inspector_user_id: 6,
      existence_status: 'Ditemukan',
      condition_status: 'Baik',
      actual_location_id: 14,
      pic_name: 'Rizal',
      photo_url: null,
      notes: 'Laptop bendahara Kelurahan Wonocolo kondisi baik & lengkap tas.',
      koordinator_note: null,
      koordinator_reviewed_by: null,
      verification_status: 'Disetujui',
      verified_by_user_id: 2,
      verified_at: '2026-11-12 10:05:00',
      rejection_reason: null,
      inspected_at: '2026-11-12 09:30:00',
    },
    {
      id: 12,
      asset_id: 17,
      period_id: 2,
      inspector_user_id: 7,
      existence_status: 'Ditemukan',
      condition_status: 'Baik',
      actual_location_id: 16,
      pic_name: 'Yoga',
      photo_url: null,
      notes: 'Mesin antrian layar sentuh berfungsi normal di Kelurahan Geluran.',
      koordinator_note: null,
      koordinator_reviewed_by: null,
      verification_status: 'Disetujui',
      verified_by_user_id: 2,
      verified_at: '2026-11-12 11:10:00',
      rejection_reason: null,
      inspected_at: '2026-11-12 10:50:00',
    },
    {
      id: 13,
      asset_id: 20,
      period_id: 2,
      inspector_user_id: 8,
      existence_status: 'Tidak ditemukan',
      condition_status: 'Rusak ringan',
      actual_location_id: 19,
      pic_name: 'Mariana',
      photo_url: null,
      notes:
        'Unit AC dilaporkan sudah dibongkar saat renovasi plafon Oktober lalu, sedang ditelusuri Berita Acara Penyimpanan.',
      koordinator_note: null,
      koordinator_reviewed_by: null,
      verification_status: 'Menunggu Verifikasi',
      verified_by_user_id: null,
      verified_at: null,
      rejection_reason: null,
      inspected_at: '2026-11-16 09:20:00',
    },
    {
      id: 14,
      asset_id: 22,
      period_id: 2,
      inspector_user_id: 9,
      existence_status: 'Ditemukan',
      condition_status: 'Baik',
      actual_location_id: 22,
      pic_name: 'Andik',
      photo_url: null,
      notes: 'Scanner dokumen arsip Kelurahan Sepanjang terpasang dan aktif.',
      koordinator_note: null,
      koordinator_reviewed_by: null,
      verification_status: 'Disetujui',
      verified_by_user_id: 2,
      verified_at: '2026-11-13 13:45:00',
      rejection_reason: null,
      inspected_at: '2026-11-13 11:15:00',
    },
    {
      id: 15,
      asset_id: 23,
      period_id: 2,
      inspector_user_id: 10,
      existence_status: 'Ditemukan',
      condition_status: 'Baik',
      actual_location_id: 25,
      pic_name: 'Laila',
      photo_url: null,
      notes: 'Laptop pengadministrasi Kelurahan Kuranji berfungsi baik dan stiker QR terbaca jelas.',
      koordinator_note: null,
      koordinator_reviewed_by: null,
      verification_status: 'Disetujui',
      verified_by_user_id: 2,
      verified_at: '2026-11-14 09:30:00',
      rejection_reason: null,
      inspected_at: '2026-11-14 08:40:00',
    },
    {
      id: 16,
      asset_id: 25,
      period_id: 2,
      inspector_user_id: 11,
      existence_status: 'Ditemukan',
      condition_status: 'Baik',
      actual_location_id: 28,
      pic_name: 'Riza',
      photo_url: null,
      notes: 'Unit PC All-in-One terpasang di loket pelayanan Kelurahan Bebekan.',
      koordinator_note: null,
      koordinator_reviewed_by: null,
      verification_status: 'Disetujui',
      verified_by_user_id: 2,
      verified_at: '2026-11-13 10:15:00',
      rejection_reason: null,
      inspected_at: '2026-11-13 09:50:00',
    },
  ];

  const maintenance_tickets: StoredTicket[] = [
    {
      id: 1,
      ticket_code: 'MNT-2026-001',
      asset_id: 2,
      reported_by_user_id: 3,
      assigned_pic: 'CV Mitra Teknika Sidoarjo',
      issue_description: 'Roller penarik kertas Tray 2 printer laser aus sehingga sering paper jam.',
      priority: 'Sedang',
      target_date: '2026-11-25',
      status: 'Dalam Proses',
      resolution_notes: 'Suku cadang pickup roller sudah dipesan, jadwal teknisi 20 Nov 2026.',
      repair_photo_url: null,
      created_at: '2026-11-11 10:30:00',
      updated_at: '2026-11-14 09:15:00',
    },
    {
      id: 2,
      ticket_code: 'MNT-2026-002',
      asset_id: 3,
      reported_by_user_id: 3,
      assigned_pic: 'Teknisi Pendingin Kec. Taman',
      issue_description: 'AC Split 2 PK Aula tidak dingin sama sekali dan kompresor outdoor tidak berputar.',
      priority: 'Tinggi',
      target_date: '2026-11-22',
      status: 'Terbuka',
      resolution_notes: null,
      repair_photo_url: null,
      created_at: '2026-11-14 14:25:00',
      updated_at: '2026-11-14 14:25:00',
    },
    {
      id: 3,
      ticket_code: 'MNT-2026-003',
      asset_id: 12,
      reported_by_user_id: 4,
      assigned_pic: 'Jasa Servis Sejuk Jaya',
      issue_description: 'Cuci berkala dan penambahan freon AC Split Ruang Lurah Taman.',
      priority: 'Rendah',
      target_date: '2026-11-30',
      status: 'Selesai',
      resolution_notes:
        'Pembersihan evaporator dan tambah tekanan freon selesai dilakukan. Suhu normal kembali.',
      repair_photo_url: null,
      created_at: '2026-11-05 09:00:00',
      updated_at: '2026-11-08 15:20:00',
    },
  ];

  const audit_logs: StoredAuditLog[] = [
    {
      id: 1,
      user_id: 2,
      action: 'IMPORT_KIB_B',
      entity_type: 'import_batch',
      entity_id: '1',
      summary: 'Import batch KIB_B_KEC_TAMAN_2026_Q3.xlsx (8 aset masuk)',
      details_json: JSON.stringify({ total_rows: 8, inserted: 8 }),
      created_at: '2026-10-02 09:15:00',
    },
    {
      id: 2,
      user_id: 2,
      action: 'IMPORT_KIB_B',
      entity_type: 'import_batch',
      entity_id: '2',
      summary: 'Import batch KIB_B_8_KELURAHAN_TAMAN_2026.xlsx (20 aset masuk)',
      details_json: JSON.stringify({ total_rows: 20, inserted: 20 }),
      created_at: '2026-10-04 14:20:00',
    },
    {
      id: 3,
      user_id: 4,
      action: 'SUBMIT_SENSUS',
      entity_type: 'asset',
      entity_id: 'AST-TMN-0006',
      summary:
        'Terdeteksi selisih lokasi: Tercatat di Ruang Sekretariat & Arsip, ditemukan di Ruang Pelayanan Kelurahan Taman.',
      details_json: JSON.stringify({
        from_location: 'Ruang Sekretariat & Arsip',
        to_location: 'Ruang Pelayanan Kelurahan Taman',
      }),
      created_at: '2026-11-15 10:05:00',
    },
    {
      id: 4,
      user_id: 2,
      action: 'REJECT_VERIFIKASI',
      entity_type: 'asset',
      entity_id: 'AST-KLT-0012',
      summary: 'Mengembalikan hasil sensus AST-KLT-0012 untuk dilengkapi foto bukti fisik.',
      details_json: JSON.stringify({ reason: 'Belum ada foto bukti fisik' }),
      created_at: '2026-11-14 16:30:00',
    },
    {
      id: 5,
      user_id: 1,
      action: 'AKTIVASI_PERIODE',
      entity_type: 'census_period',
      entity_id: '2',
      summary: 'Mengaktifkan periode Sensus KIB B Semester II Tahun 2026 oleh Rizka Aprilia.',
      details_json: JSON.stringify({ period_code: 'SENSUS-2026-S2' }),
      created_at: '2026-10-01 08:00:00',
    },
  ];

  return {
    roles,
    locations,
    users,
    census_periods,
    import_batches,
    assets,
    asset_inspections,
    maintenance_tickets,
    audit_logs,
    sessions: {
      'mock-session-admin-1': 1,
    },
  };
}

let memoryDb: MockDatabase | null = null;

function getDb(): MockDatabase {
  if (memoryDb) return memoryDb;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MockDatabase;
      if (parsed && Array.isArray(parsed.assets) && Array.isArray(parsed.users)) {
        memoryDb = parsed;
        return memoryDb;
      }
    }
  } catch {
    // ignore storage errors
  }
  memoryDb = createInitialDatabase();
  saveDb(memoryDb);
  return memoryDb;
}

function saveDb(db: MockDatabase): void {
  memoryDb = db;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // ignore quota errors
  }
}

function nextId(items: Array<{ id: number }>): number {
  return items.length === 0 ? 1 : Math.max(...items.map((i) => i.id)) + 1;
}

function loadUserWithRole(db: MockDatabase, userId: number): UserAccount | null {
  const u = db.users.find((x) => x.id === userId);
  if (!u) return null;
  const role = db.roles.find((r) => r.id === u.role_id);
  const loc = db.locations.find((l) => l.id === u.location_id);
  if (!role || !loc) return null;
  return {
    id: u.id,
    name: u.name,
    employee_id: u.employee_id,
    location_id: u.location_id,
    location_name: loc.name,
    location_type: loc.type,
    role_id: u.role_id,
    role_code: role.code as RoleCode,
    role_name: role.name,
    permissions: [...role.permissions],
    email: u.email,
    status: u.status,
  };
}

function getTopUnitLocation(
  db: MockDatabase,
  locationId: number
): { id: number; name: string; type: LocationType } {
  const byId = new Map(db.locations.map((l) => [l.id, l]));
  const curr = byId.get(locationId);
  if (!curr) return { id: locationId, name: 'Kecamatan Taman', type: 'Kecamatan' };
  if (curr.type === 'Ruang' && curr.parent_id) {
    const parent = byId.get(curr.parent_id);
    if (parent) return { id: parent.id, name: parent.name, type: parent.type };
  }
  return { id: curr.id, name: curr.name, type: curr.type };
}

function getAllowedLocationIds(db: MockDatabase, user: UserAccount): number[] | null {
  if (
    user.role_code === 'ADMIN_SISTEM' ||
    user.role_code === 'PENGURUS_BARANG' ||
    user.role_code === 'PIMPINAN_VIEWER'
  ) {
    return null;
  }

  if (user.role_code === 'PETUGAS_KECAMATAN') {
    const kec = db.locations.find((l) => l.type === 'Kecamatan');
    if (!kec) return [];
    return db.locations
      .filter((l) => l.id === kec.id || (l.type === 'Ruang' && l.parent_id === kec.id))
      .map((l) => l.id);
  }

  const unit = getTopUnitLocation(db, user.location_id);
  return db.locations
    .filter((l) => l.id === unit.id || l.parent_id === unit.id)
    .map((l) => l.id);
}

function enrichAssets(
  db: MockDatabase,
  rows: StoredAsset[],
  activePeriodId: number | null
): AssetRecord[] {
  const locMap = new Map(db.locations.map((l) => [l.id, l]));

  return rows.map((row) => {
    const unit = getTopUnitLocation(db, row.recorded_location_id);
    const matchingInsps = db.asset_inspections
      .filter((i) => i.asset_id === row.id && (!activePeriodId || i.period_id === activePeriodId))
      .sort((a, b) => b.id - a.id);
    const latest = matchingInsps[0];

    let existenceStatus: ExistenceStatus = 'Belum diperiksa';
    if (latest) {
      if (
        latest.existence_status === 'Tidak ditemukan' &&
        latest.verification_status === 'Menunggu Verifikasi'
      ) {
        existenceStatus = 'Dalam verifikasi';
      } else {
        existenceStatus = latest.existence_status;
      }
    }

    const actualLoc = latest ? locMap.get(latest.actual_location_id) : undefined;
    const recordedLoc = locMap.get(row.recorded_location_id);

    return {
      ...row,
      recorded_location_name: recordedLoc?.name || 'Kecamatan Taman',
      recorded_unit_name: unit.name,
      latest_inspection_id: latest ? latest.id : null,
      latest_existence_status: existenceStatus,
      latest_condition_status: latest ? latest.condition_status : null,
      latest_actual_location_id: latest ? latest.actual_location_id : null,
      latest_actual_location_name: actualLoc ? actualLoc.name : null,
      latest_pic_name: latest ? latest.pic_name : null,
      latest_verification_status: latest ? latest.verification_status : null,
      latest_inspected_at: latest ? latest.inspected_at : null,
      has_location_discrepancy: Boolean(
        latest && latest.actual_location_id !== row.recorded_location_id
      ),
    };
  });
}

function enrichInspections(db: MockDatabase, list: StoredInspection[]): AssetInspection[] {
  const assetMap = new Map(db.assets.map((a) => [a.id, a]));
  const locMap = new Map(db.locations.map((l) => [l.id, l]));
  const periodMap = new Map(db.census_periods.map((p) => [p.id, p]));
  const userMap = new Map(db.users.map((u) => [u.id, u]));

  return list.map((ai) => {
    const asset = assetMap.get(ai.asset_id)!;
    const recLoc = locMap.get(asset.recorded_location_id);
    const actLoc = locMap.get(ai.actual_location_id);
    const period = periodMap.get(ai.period_id);
    const inspector = userMap.get(ai.inspector_user_id);
    const verifier = ai.verified_by_user_id ? userMap.get(ai.verified_by_user_id) : undefined;

    return {
      ...ai,
      asset_code: asset.asset_id,
      asset_name: asset.name,
      kib_code: asset.kib_code,
      register_number: asset.register_number,
      recorded_location_id: asset.recorded_location_id,
      recorded_location_name: recLoc?.name || '-',
      recorded_condition: asset.recorded_condition,
      period_name: period?.name || '-',
      inspector_name: inspector?.name || '-',
      verified_by_name: verifier?.name || null,
      actual_location_name: actLoc?.name || '-',
    };
  });
}

function enrichAuditLogs(db: MockDatabase, list: StoredAuditLog[]): AuditLog[] {
  const userMap = new Map(db.users.map((u) => [u.id, u]));
  const roleMap = new Map(db.roles.map((r) => [r.id, r]));
  return list.map((al) => {
    const u = userMap.get(al.user_id);
    const r = u ? roleMap.get(u.role_id) : undefined;
    return {
      ...al,
      user_name: u?.name || 'Sistem',
      role_name: r?.name || '-',
    };
  });
}

function logAudit(
  db: MockDatabase,
  userId: number,
  action: string,
  entityType: string,
  entityId: string,
  summary: string,
  details?: Record<string, unknown>
): void {
  db.audit_logs.push({
    id: nextId(db.audit_logs),
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    summary,
    details_json: details ? JSON.stringify(details) : null,
    created_at: nowTimestamp(),
  });
}

function requireUser(db: MockDatabase, token: string | null): UserAccount {
  let user: UserAccount | null = null;
  if (token && db.sessions[token]) {
    user = loadUserWithRole(db, db.sessions[token]);
  }
  if (!user) {
    // Fallback gracefully to Rizka Aprilia so client-side session never stalls
    user = loadUserWithRole(db, 1);
  }
  if (!user) {
    throw new Error('Sesi tidak valid.');
  }
  if (user.status !== 'Aktif') {
    throw new Error('Akun dinonaktifkan oleh Admin Sistem.');
  }
  return user;
}

function requirePermission(user: UserAccount, perm: string): void {
  if (!user.permissions.includes(perm)) {
    throw new Error(`Akses ditolak. Peran "${user.role_name}" tidak memiliki izin (${perm}).`);
  }
}

function getActivePeriod(db: MockDatabase): CensusPeriod | null {
  const actives = db.census_periods.filter((p) => p.status === 'Aktif').sort((a, b) => b.id - a.id);
  return actives[0] || null;
}

export async function mockApiRequest<T>(
  rawPath: string,
  options: RequestInit = {},
  sessionToken: string | null
): Promise<T> {
  const db = getDb();
  const method = (options.method || 'GET').toUpperCase();
  const [pathname, queryString] = rawPath.split('?');
  const params = new URLSearchParams(queryString || '');
  const body = options.body ? (JSON.parse(String(options.body)) as Record<string, unknown>) : {};

  // --- AUTH ---
  if (pathname === '/auth/demo-accounts' && method === 'GET') {
    const accounts = db.users
      .filter((u) => u.status === 'Aktif')
      .map((u) => {
        const r = db.roles.find((x) => x.id === u.role_id)!;
        const l = db.locations.find((x) => x.id === u.location_id)!;
        return {
          id: u.id,
          name: u.name,
          employee_id: u.employee_id,
          email: u.email,
          status: u.status,
          role_id: u.role_id,
          role_code: r.code,
          role_name: r.name,
          location_name: l.name,
          location_type: l.type,
        };
      })
      .sort((a, b) => a.role_id - b.role_id || a.id - b.id);
    return { accounts } as T;
  }

  if (pathname === '/auth/demo-switch' && method === 'POST') {
    const targetId = Number(body.userId) || 1;
    const user = loadUserWithRole(db, targetId);
    if (!user || user.status !== 'Aktif') {
      throw new Error('Akun demo tidak ditemukan atau tidak aktif.');
    }
    const token = `mock-${user.id}-${randomHex(8)}`;
    db.sessions[token] = user.id;
    saveDb(db);
    return { token, user } as T;
  }

  if (pathname === '/auth/login' && method === 'POST') {
    const identifier = String(body.identifier || '').trim();
    const password = String(body.password || '');
    if (!identifier || !password) {
      throw new Error('Email/NIP dan kata sandi wajib diisi.');
    }
    const row = db.users.find(
      (u) => u.email.toLowerCase() === identifier.toLowerCase() || u.employee_id === identifier
    );
    if (!row || row.password !== password) {
      throw new Error('Email/NIP atau kata sandi tidak sesuai.');
    }
    if (row.status !== 'Aktif') {
      throw new Error('Akun Anda sedang dinonaktifkan.');
    }
    const token = `mock-${row.id}-${randomHex(8)}`;
    db.sessions[token] = row.id;
    saveDb(db);
    return { token, user: loadUserWithRole(db, row.id) } as T;
  }

  if (pathname === '/auth/me' && method === 'GET') {
    const user = requireUser(db, sessionToken);
    return { user } as T;
  }

  if (pathname === '/auth/logout' && method === 'POST') {
    if (sessionToken && db.sessions[sessionToken]) {
      delete db.sessions[sessionToken];
      saveDb(db);
    }
    return { ok: true } as T;
  }

  // Authenticated endpoints below
  const currentUser = requireUser(db, sessionToken);
  const allowedIds = getAllowedLocationIds(db, currentUser);
  const activePeriod = getActivePeriod(db);
  const activePeriodId = activePeriod ? activePeriod.id : null;

  // --- DASHBOARD ---
  if (pathname === '/dashboard' && method === 'GET') {
    const scopedRaw =
      allowedIds === null
        ? db.assets
        : db.assets.filter((a) => allowedIds.includes(a.recorded_location_id));
    const enriched = enrichAssets(db, scopedRaw, activePeriodId);

    const totalAssets = enriched.length;
    const inspectedAssets = enriched.filter(
      (a) => a.latest_existence_status !== 'Belum diperiksa'
    ).length;
    const uninspectedAssets = totalAssets - inspectedAssets;
    const foundAssets = enriched.filter((a) => a.latest_existence_status === 'Ditemukan').length;
    const missingAssets = enriched.filter(
      (a) => a.latest_existence_status === 'Tidak ditemukan'
    ).length;
    const inVerificationAssets = enriched.filter(
      (a) =>
        a.latest_existence_status === 'Dalam verifikasi' ||
        a.latest_verification_status === 'Menunggu Verifikasi'
    ).length;
    const damagedAssets = enriched.filter((a) => {
      const cond = a.latest_condition_status || a.recorded_condition;
      return cond === 'Rusak ringan' || cond === 'Rusak berat' || cond === 'Tidak layak pakai';
    }).length;
    const pendingVerificationQueue = enriched.filter(
      (a) => a.latest_verification_status === 'Menunggu Verifikasi'
    ).length;
    const locationDiscrepancyCount = enriched.filter((a) => a.has_location_discrepancy).length;
    const totalAcquisitionValue = enriched.reduce(
      (acc, a) => acc + Number(a.acquisition_value || 0),
      0
    );

    const allUnits = db.locations.filter((l) => l.type === 'Kecamatan' || l.type === 'Kelurahan');
    const locationProgress = allUnits
      .filter((u) => allowedIds === null || allowedIds.includes(u.id))
      .map((u) => {
        const unitLocIds =
          u.type === 'Kecamatan'
            ? db.locations
                .filter((l) => l.id === u.id || (l.type === 'Ruang' && l.parent_id === u.id))
                .map((l) => l.id)
            : db.locations.filter((l) => l.id === u.id || l.parent_id === u.id).map((l) => l.id);

        const unitAssets = enriched.filter((a) => unitLocIds.includes(a.recorded_location_id));
        const total = unitAssets.length;
        const inspected = unitAssets.filter(
          (a) => a.latest_existence_status !== 'Belum diperiksa'
        ).length;
        const found = unitAssets.filter((a) => a.latest_existence_status === 'Ditemukan').length;
        const missing = unitAssets.filter(
          (a) => a.latest_existence_status === 'Tidak ditemukan'
        ).length;
        const in_verification = unitAssets.filter(
          (a) =>
            a.latest_existence_status === 'Dalam verifikasi' ||
            a.latest_verification_status === 'Menunggu Verifikasi'
        ).length;
        const damaged = unitAssets.filter((a) => {
          const c = a.latest_condition_status || a.recorded_condition;
          return c !== 'Baik';
        }).length;

        return {
          location_id: u.id,
          name: u.type === 'Kecamatan' ? 'Kantor Kecamatan Taman' : u.name,
          type: u.type,
          total,
          inspected,
          found,
          missing,
          in_verification,
          damaged,
          progress_pct: total > 0 ? Math.round((inspected / total) * 100) : 0,
        };
      });

    const condMap: Record<string, number> = {
      Baik: 0,
      'Rusak ringan': 0,
      'Rusak berat': 0,
      'Tidak layak pakai': 0,
    };
    for (const a of enriched) {
      const cond = String(a.latest_condition_status || a.recorded_condition);
      condMap[cond] = (condMap[cond] || 0) + 1;
    }
    const conditionBreakdown = Object.entries(condMap).map(([condition, count]) => ({
      condition,
      count,
    }));

    const exceptionAlerts: DashboardData['exceptionAlerts'] = [];
    for (const a of enriched) {
      if (
        a.latest_existence_status === 'Dalam verifikasi' ||
        a.latest_existence_status === 'Tidak ditemukan'
      ) {
        exceptionAlerts.push({
          id: `missing-${a.id}`,
          severity: 'critical',
          category: 'Verifikasi Keberadaan',
          asset_id: a.id,
          asset_code: a.asset_id,
          asset_name: a.name,
          location_name: a.recorded_location_name,
          message:
            'Aset dilaporkan belum ditemukan di lokasi tercatat — masuk antrean verifikasi manual.',
          timestamp: a.latest_inspected_at || a.created_at,
        });
      } else if (a.has_location_discrepancy) {
        exceptionAlerts.push({
          id: `disc-${a.id}`,
          severity: 'warning',
          category: 'Selisih Lokasi',
          asset_id: a.id,
          asset_code: a.asset_id,
          asset_name: a.name,
          location_name: String(a.latest_actual_location_name),
          message: `Tercatat di ${a.recorded_location_name}, ditemukan di ${a.latest_actual_location_name}.`,
          timestamp: a.latest_inspected_at || a.created_at,
        });
      } else if (
        a.latest_condition_status === 'Rusak berat' ||
        a.latest_condition_status === 'Tidak layak pakai'
      ) {
        exceptionAlerts.push({
          id: `dmg-${a.id}`,
          severity: 'warning',
          category: 'Kondisi Berat',
          asset_id: a.id,
          asset_code: a.asset_id,
          asset_name: a.name,
          location_name: String(a.latest_actual_location_name || a.recorded_location_name),
          message: `Dilaporkan ${a.latest_condition_status} — memerlukan peninjauan & tiket pemeliharaan.`,
          timestamp: a.latest_inspected_at || a.created_at,
        });
      } else if (a.latest_verification_status === 'Dikembalikan') {
        exceptionAlerts.push({
          id: `ret-${a.id}`,
          severity: 'info',
          category: 'Perlu Revisi Petugas',
          asset_id: a.id,
          asset_code: a.asset_id,
          asset_name: a.name,
          location_name: a.recorded_location_name,
          message: 'Hasil sensus dikembalikan oleh Pengurus Barang untuk dilengkapi bukti.',
          timestamp: a.latest_inspected_at || a.created_at,
        });
      }
    }

    const recentLogs = enrichAuditLogs(
      db,
      [...db.audit_logs].sort((a, b) => b.id - a.id).slice(0, 8)
    );

    const payload: DashboardData = {
      activePeriod,
      kpi: {
        totalAssets,
        inspectedAssets,
        uninspectedAssets,
        foundAssets,
        missingAssets,
        inVerificationAssets,
        damagedAssets,
        pendingVerificationQueue,
        locationDiscrepancyCount,
        totalAcquisitionValue,
      },
      locationProgress,
      conditionBreakdown,
      exceptionAlerts: exceptionAlerts.slice(0, 10),
      recentLogs,
    };
    return payload as T;
  }

  // --- ASSETS ---
  if (pathname === '/assets' && method === 'GET') {
    const scopedRaw = (
      allowedIds === null
        ? db.assets
        : db.assets.filter((a) => allowedIds.includes(a.recorded_location_id))
    ).sort((a, b) => a.id - b.id);

    let enriched = enrichAssets(db, scopedRaw, activePeriodId);

    const search = params.get('search');
    const category = params.get('category');
    const condition = params.get('condition');
    const locationId = params.get('locationId');
    const existence = params.get('existence');

    if (search) {
      const q = search.toLowerCase();
      enriched = enriched.filter(
        (a) =>
          a.asset_id.toLowerCase().includes(q) ||
          a.register_number.toLowerCase().includes(q) ||
          a.kib_code.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          a.brand.toLowerCase().includes(q) ||
          a.model.toLowerCase().includes(q)
      );
    }
    if (category && category !== 'ALL') {
      enriched = enriched.filter((a) => a.category === category);
    }
    if (condition && condition !== 'ALL') {
      enriched = enriched.filter((a) => a.recorded_condition === condition);
    }
    if (locationId && locationId !== 'ALL') {
      const targetLocId = Number(locationId);
      const targetLoc = db.locations.find((l) => l.id === targetLocId);
      let matchIds = [targetLocId];
      if (targetLoc?.type === 'Kecamatan') {
        matchIds = db.locations
          .filter((l) => l.id === targetLocId || (l.type === 'Ruang' && l.parent_id === targetLocId))
          .map((l) => l.id);
      } else if (targetLoc?.type === 'Kelurahan') {
        matchIds = db.locations
          .filter((l) => l.id === targetLocId || l.parent_id === targetLocId)
          .map((l) => l.id);
      }
      enriched = enriched.filter((a) => matchIds.includes(a.recorded_location_id));
    }
    if (existence && existence !== 'ALL') {
      enriched = enriched.filter((a) => a.latest_existence_status === existence);
    }

    return { assets: enriched } as T;
  }

  if (pathname.startsWith('/assets/by-qr/') && method === 'GET') {
    const q = decodeURIComponent(pathname.replace('/assets/by-qr/', '')).trim();
    const raw = db.assets.find(
      (a) =>
        a.qr_token === q ||
        a.asset_id.toUpperCase() === q.toUpperCase() ||
        a.register_number.toUpperCase() === q.toUpperCase()
    );
    if (!raw) {
      throw new Error(`Aset dengan kode atau QR "${q}" tidak ditemukan.`);
    }
    const locName = db.locations.find((l) => l.id === raw.recorded_location_id)?.name || '-';
    if (allowedIds !== null && !allowedIds.includes(raw.recorded_location_id)) {
      throw new Error(
        `Akses wilayah ditolak: Aset ${raw.asset_id} tercatat di "${locName}" di luar wilayah tugas Anda (${currentUser.location_name}).`
      );
    }
    const [asset] = enrichAssets(db, [raw], activePeriodId);
    return { asset } as T;
  }

  if (pathname === '/assets/qr-batch' && method === 'POST') {
    requirePermission(currentUser, 'qrcode:manage');
    const assetIds = Array.isArray(body.assetIds) ? (body.assetIds as number[]) : [];
    if (assetIds.length === 0) {
      throw new Error('Pilih minimal satu aset untuk generate token QR.');
    }
    const updated: Array<{ id: number; asset_id: string; qr_token: string }> = [];
    for (const id of assetIds) {
      const a = db.assets.find((x) => x.id === id);
      if (a) {
        a.qr_token = `QR-${a.asset_id}-${randomHex(2)}`;
        updated.push({ id: a.id, asset_id: a.asset_id, qr_token: a.qr_token });
      }
    }
    logAudit(
      db,
      currentUser.id,
      'GENERATE_QR_TOKEN',
      'qr_batch',
      String(updated.length),
      `Generate/perbarui token QR unik untuk ${updated.length} aset KIB B.`,
      { asset_ids: updated.map((u) => u.asset_id) }
    );
    saveDb(db);
    return { updated } as T;
  }

  if (/^\/assets\/\d+$/.test(pathname) && method === 'GET') {
    const id = Number(pathname.split('/')[2]);
    const raw = db.assets.find((a) => a.id === id);
    if (!raw) throw new Error('Aset tidak ditemukan.');
    if (allowedIds !== null && !allowedIds.includes(raw.recorded_location_id)) {
      throw new Error('Aset berada di luar wilayah akses Anda.');
    }
    const [asset] = enrichAssets(db, [raw], activePeriodId);
    const inspections = enrichInspections(
      db,
      db.asset_inspections.filter((i) => i.asset_id === id).sort((a, b) => b.id - a.id)
    );
    const userMap = new Map(db.users.map((u) => [u.id, u]));
    const tickets: MaintenanceTicket[] = db.maintenance_tickets
      .filter((t) => t.asset_id === id)
      .sort((a, b) => b.id - a.id)
      .map((t) => ({
        ...t,
        asset_code: raw.asset_id,
        asset_name: raw.name,
        location_name: asset.recorded_location_name,
        reported_by_name: userMap.get(t.reported_by_user_id)?.name || '-',
      }));
    const logs = enrichAuditLogs(
      db,
      db.audit_logs
        .filter((l) => l.entity_type === 'asset' && l.entity_id === raw.asset_id)
        .sort((a, b) => b.id - a.id)
    );
    return { asset, inspections, tickets, logs } as T;
  }

  // --- IMPORT KIB B ---
  if (pathname === '/import/batches' && method === 'GET') {
    const userMap = new Map(db.users.map((u) => [u.id, u]));
    const batches: ImportBatch[] = [...db.import_batches]
      .sort((a, b) => b.id - a.id)
      .map((b) => ({
        ...b,
        imported_by_name: userMap.get(b.imported_by_user_id)?.name || '-',
      }));
    return { batches } as T;
  }

  if (pathname === '/import/preview' && method === 'POST') {
    requirePermission(currentUser, 'import:execute');
    const rows = Array.isArray(body.rows) ? (body.rows as Array<Record<string, unknown>>) : [];
    if (rows.length === 0) throw new Error('Tidak ada baris data yang dikirim untuk validasi.');

    const existingRegs = new Set(db.assets.map((a) => a.register_number.toUpperCase()));
    const existingIds = new Set(db.assets.map((a) => a.asset_id.toUpperCase()));
    const seenInBatch = new Set<string>();

    const validated = rows.map((row, idx) => {
      const errors: string[] = [];
      const kibCode = String(row.kib_code || '').trim();
      const registerNumber = String(row.register_number || '').trim();
      const name = String(row.name || '').trim();
      const locRaw = String(row.location_name || '').trim();
      const assetIdRaw = String(
        row.asset_id || `AST-IMP-${String(Date.now()).slice(-4)}-${idx + 1}`
      ).trim();

      if (!kibCode) errors.push('Kode Barang (KIB) kosong');
      if (!registerNumber) errors.push('Nomor Register kosong');
      if (!name) errors.push('Nama Barang kosong');

      let isDuplicate = false;
      if (registerNumber && existingRegs.has(registerNumber.toUpperCase())) {
        isDuplicate = true;
        errors.push(`Nomor Register ${registerNumber} sudah ada di Master KIB B`);
      }
      if (registerNumber && seenInBatch.has(registerNumber.toUpperCase())) {
        isDuplicate = true;
        errors.push(`Duplikasi Nomor Register ${registerNumber} di dalam file`);
      }
      if (existingIds.has(assetIdRaw.toUpperCase())) {
        isDuplicate = true;
        errors.push(`Asset ID ${assetIdRaw} sudah terdaftar`);
      }
      if (registerNumber) seenInBatch.add(registerNumber.toUpperCase());

      const matchedLoc =
        db.locations.find(
          (l) =>
            l.name.toLowerCase() === locRaw.toLowerCase() ||
            l.code.toLowerCase() === locRaw.toLowerCase() ||
            (locRaw && l.name.toLowerCase().includes(locRaw.toLowerCase()))
        ) || db.locations[0];

      const condRaw = String(row.recorded_condition || '').trim();
      const validCond: ConditionStatus = (
        ['Baik', 'Rusak ringan', 'Rusak berat', 'Tidak layak pakai'] as const
      ).includes(condRaw as ConditionStatus)
        ? (condRaw as ConditionStatus)
        : 'Baik';

      return {
        rowIndex: idx + 1,
        asset_id: assetIdRaw,
        kib_code: kibCode,
        register_number: registerNumber,
        name,
        category: String(row.category || 'Peralatan Kantor').trim(),
        brand: String(row.brand || '-').trim(),
        model: String(row.model || '-').trim(),
        serial_number: String(row.serial_number || '-').trim(),
        acquisition_year: Number(row.acquisition_year) || 2024,
        acquisition_value:
          Number(String(row.acquisition_value || '0').replace(/[^0-9.-]/g, '')) || 0,
        recorded_condition: validCond,
        recorded_location_id: matchedLoc.id,
        recorded_location_name: matchedLoc.name,
        isDuplicate,
        isValid: errors.length === 0,
        errors,
      };
    });

    return {
      summary: {
        total: validated.length,
        valid: validated.filter((v) => v.isValid).length,
        duplicates: validated.filter((v) => v.isDuplicate).length,
        errors: validated.filter((v) => !v.isValid && !v.isDuplicate).length,
      },
      rows: validated,
    } as T;
  }

  if (pathname === '/import/commit' && method === 'POST') {
    requirePermission(currentUser, 'import:execute');
    const filename = String(body.filename || '');
    const rows = Array.isArray(body.rows) ? (body.rows as Array<Record<string, unknown>>) : [];
    const columnMapping = (body.columnMapping as Record<string, string>) || {};
    const notes = body.notes ? String(body.notes) : null;

    if (!filename || rows.length === 0) throw new Error('Data batch import tidak valid.');

    const validRows = rows.filter((r) => Boolean(r.isValid) && !r.isDuplicate);
    const dupCount = rows.filter((r) => Boolean(r.isDuplicate)).length;
    const errCount = rows.filter((r) => !r.isValid && !r.isDuplicate).length;

    const batchId = nextId(db.import_batches);
    db.import_batches.push({
      id: batchId,
      filename,
      imported_by_user_id: currentUser.id,
      total_rows: rows.length,
      inserted_rows: validRows.length,
      duplicate_rows: dupCount,
      error_rows: errCount,
      column_mapping_json: JSON.stringify(columnMapping),
      status: validRows.length > 0 ? 'Selesai' : 'Dilewati (Tidak ada baris valid)',
      notes,
      created_at: nowTimestamp(),
    });

    for (const r of validRows) {
      const assetCode = String(r.asset_id);
      db.assets.push({
        id: nextId(db.assets),
        asset_id: assetCode,
        kib_code: String(r.kib_code),
        register_number: String(r.register_number),
        name: String(r.name),
        category: String(r.category || 'Peralatan Kantor'),
        brand: String(r.brand || '-'),
        model: String(r.model || '-'),
        serial_number: String(r.serial_number || '-'),
        acquisition_year: Number(r.acquisition_year) || 2024,
        acquisition_value: Number(r.acquisition_value) || 0,
        recorded_condition: (r.recorded_condition as ConditionStatus) || 'Baik',
        recorded_location_id: Number(r.recorded_location_id) || 1,
        official_status: 'Tercatat KIB B',
        qr_token: `QR-${assetCode}-${randomHex(2)}`,
        import_batch_id: batchId,
        created_at: nowTimestamp(),
      });
    }

    logAudit(
      db,
      currentUser.id,
      'IMPORT_KIB_B',
      'import_batch',
      String(batchId),
      `Import KIB B "${filename}": ${validRows.length} aset ditambahkan, ${dupCount} duplikat dilewati, ${errCount} error.`,
      { filename, inserted: validRows.length, duplicates: dupCount, errors: errCount }
    );
    saveDb(db);
    return { batchId, inserted: validRows.length, duplicates: dupCount, errors: errCount } as T;
  }

  // --- UPLOADS (CLIENT-SIDE DATAURL) ---
  if (pathname === '/uploads' && method === 'POST') {
    const dataUrl = String(body.dataUrl || '');
    if (!dataUrl.startsWith('data:image/')) {
      throw new Error('Format gambar bukti tidak valid.');
    }
    return { url: dataUrl } as T;
  }

  // --- INSPECTIONS / SENSUS & VERIFIKASI ---
  if (pathname === '/inspections' && method === 'GET') {
    const status = params.get('status');
    const assetMap = new Map(db.assets.map((a) => [a.id, a]));
    const filtered = db.asset_inspections
      .filter((ai) => {
        const asset = assetMap.get(ai.asset_id);
        if (!asset) return false;
        if (allowedIds !== null && !allowedIds.includes(asset.recorded_location_id)) return false;
        if (status && status !== 'ALL' && ai.verification_status !== status) return false;
        return true;
      })
      .sort((a, b) => b.id - a.id);

    return { inspections: enrichInspections(db, filtered) } as T;
  }

  if (pathname === '/inspections' && method === 'POST') {
    requirePermission(currentUser, 'census:submit');
    const asset_id = Number(body.asset_id);
    const existence_status = String(body.existence_status || '') as ExistenceStatus;
    const condition_status = String(body.condition_status || '') as ConditionStatus;
    const actual_location_id = Number(body.actual_location_id);
    const pic_name = String(body.pic_name || '').trim();
    const photo_url = body.photo_url ? String(body.photo_url) : null;
    const notes = body.notes ? String(body.notes) : null;

    if (!asset_id || !existence_status || !condition_status || !actual_location_id || !pic_name) {
      throw new Error('Seluruh kolom wajib sensus fisik harus diisi.');
    }
    const asset = db.assets.find((a) => a.id === asset_id);
    if (!asset) throw new Error('Aset tidak ditemukan.');
    if (allowedIds !== null && !allowedIds.includes(asset.recorded_location_id)) {
      throw new Error('Anda tidak memiliki izin memeriksa aset di luar wilayah kelurahan/unit Anda.');
    }
    if (!activePeriod) {
      throw new Error('Tidak ada periode sensus yang sedang aktif.');
    }

    const normalizedExistence: ExistenceStatus =
      existence_status === 'Tidak ditemukan' ? 'Dalam verifikasi' : existence_status;

    const id = nextId(db.asset_inspections);
    db.asset_inspections.push({
      id,
      asset_id: asset.id,
      period_id: activePeriod.id,
      inspector_user_id: currentUser.id,
      existence_status: normalizedExistence,
      condition_status,
      actual_location_id,
      pic_name,
      photo_url,
      notes,
      koordinator_note: null,
      koordinator_reviewed_by: null,
      verification_status: 'Menunggu Verifikasi',
      verified_by_user_id: null,
      verified_at: null,
      rejection_reason: null,
      inspected_at: nowTimestamp(),
    });

    logAudit(
      db,
      currentUser.id,
      'SUBMIT_SENSUS',
      'asset',
      asset.asset_id,
      `Input sensus fisik ${asset.asset_id} (${asset.name}): Keberadaan="${existence_status}", Kondisi="${condition_status}". Menunggu verifikasi Pengurus Barang.`,
      { existence_status, condition_status, actual_location_id, pic_name }
    );
    saveDb(db);
    return { id, verification_status: 'Menunggu Verifikasi' } as T;
  }

  const koordMatch = pathname.match(/^\/inspections\/(\d+)\/koordinator-review$/);
  if (koordMatch && method === 'PATCH') {
    requirePermission(currentUser, 'verification:koordinator_review');
    const id = Number(koordMatch[1]);
    const koordinator_note = String(body.koordinator_note || '').trim();
    if (!koordinator_note) throw new Error('Catatan review awal koordinator wajib diisi.');

    const insp = db.asset_inspections.find((i) => i.id === id);
    if (!insp) throw new Error('Data inspeksi tidak ditemukan.');
    const asset = db.assets.find((a) => a.id === insp.asset_id)!;
    if (allowedIds !== null && !allowedIds.includes(asset.recorded_location_id)) {
      throw new Error('Inspeksi berada di luar wilayah kelurahan Anda.');
    }
    insp.koordinator_note = koordinator_note;
    insp.koordinator_reviewed_by = currentUser.name;
    logAudit(
      db,
      currentUser.id,
      'REVIEW_KOORDINATOR',
      'asset',
      asset.asset_id,
      `Review awal Koordinator Kelurahan untuk ${asset.asset_id}: "${koordinator_note}"`
    );
    saveDb(db);
    return { ok: true } as T;
  }

  const verifyMatch = pathname.match(/^\/inspections\/(\d+)\/verify$/);
  if (verifyMatch && method === 'PATCH') {
    requirePermission(currentUser, 'verification:approve');
    const id = Number(verifyMatch[1]);
    const decision = String(body.decision || '') as 'Disetujui' | 'Dikembalikan';
    const rejection_reason = body.rejection_reason ? String(body.rejection_reason).trim() : '';
    const confirm_missing = Boolean(body.confirm_missing);

    if (decision !== 'Disetujui' && decision !== 'Dikembalikan') {
      throw new Error('Keputusan verifikasi tidak valid.');
    }
    if (decision === 'Dikembalikan' && !rejection_reason) {
      throw new Error('Alasan pengembalian wajib diisi saat menolak hasil sensus.');
    }

    const insp = db.asset_inspections.find((i) => i.id === id);
    if (!insp) throw new Error('Data inspeksi tidak ditemukan.');
    const asset = db.assets.find((a) => a.id === insp.asset_id)!;

    let finalExistence = insp.existence_status;
    if (decision === 'Disetujui' && finalExistence === 'Dalam verifikasi' && confirm_missing) {
      finalExistence = 'Tidak ditemukan';
    }

    insp.existence_status = finalExistence;
    insp.verification_status = decision;
    insp.verified_by_user_id = currentUser.id;
    insp.verified_at = nowTimestamp();
    insp.rejection_reason = decision === 'Dikembalikan' ? rejection_reason : null;

    logAudit(
      db,
      currentUser.id,
      decision === 'Disetujui' ? 'APPROVE_VERIFIKASI' : 'REJECT_VERIFIKASI',
      'asset',
      asset.asset_id,
      decision === 'Disetujui'
        ? `Menyetujui hasil sensus ${asset.asset_id} (${asset.name}) — Keberadaan: ${finalExistence}, Kondisi: ${insp.condition_status}. Data resmi KIB B tetap terjaga.`
        : `Mengembalikan hasil sensus ${asset.asset_id}: ${rejection_reason}`,
      { decision, finalExistence, rejection_reason }
    );
    saveDb(db);
    return { ok: true, verification_status: decision, existence_status: finalExistence } as T;
  }

  // --- MONITORING & RIWAYAT ---
  if (pathname === '/monitoring' && method === 'GET') {
    const assetMap = new Map(db.assets.map((a) => [a.id, a]));
    const scopedInsps = db.asset_inspections
      .filter((ai) => {
        const asset = assetMap.get(ai.asset_id);
        if (!asset) return false;
        return allowedIds === null || allowedIds.includes(asset.recorded_location_id);
      })
      .sort((a, b) => b.id - a.id);

    const enrichedInsps = enrichInspections(db, scopedInsps);
    const locationDiscrepancies = enrichedInsps.filter(
      (i) => i.actual_location_id !== i.recorded_location_id
    );
    const conditionChanges = enrichedInsps.filter(
      (i) => i.condition_status !== i.recorded_condition
    );
    const auditLogs = enrichAuditLogs(
      db,
      [...db.audit_logs].sort((a, b) => b.id - a.id).slice(0, 100)
    );

    return {
      activePeriodId,
      locationDiscrepancies,
      conditionChanges,
      auditLogs,
    } as T;
  }

  // --- MAINTENANCE ---
  if (pathname === '/maintenance' && method === 'GET') {
    const assetMap = new Map(db.assets.map((a) => [a.id, a]));
    const locMap = new Map(db.locations.map((l) => [l.id, l]));
    const userMap = new Map(db.users.map((u) => [u.id, u]));

    const tickets: MaintenanceTicket[] = db.maintenance_tickets
      .filter((t) => {
        const a = assetMap.get(t.asset_id);
        if (!a) return false;
        return allowedIds === null || allowedIds.includes(a.recorded_location_id);
      })
      .sort((a, b) => b.id - a.id)
      .map((t) => {
        const a = assetMap.get(t.asset_id)!;
        const l = locMap.get(a.recorded_location_id);
        const u = userMap.get(t.reported_by_user_id);
        return {
          ...t,
          asset_code: a.asset_id,
          asset_name: a.name,
          location_name: l?.name || '-',
          reported_by_name: u?.name || '-',
        };
      });

    return { tickets } as T;
  }

  if (pathname === '/maintenance' && method === 'POST') {
    if (
      !currentUser.permissions.includes('maintenance:manage') &&
      !currentUser.permissions.includes('maintenance:report')
    ) {
      throw new Error('Akses ditolak untuk membuat tiket pemeliharaan.');
    }
    const asset_id = Number(body.asset_id);
    const issue_description = String(body.issue_description || '').trim();
    const assigned_pic = String(body.assigned_pic || '').trim() || 'Teknisi Kecamatan Taman';
    const priority = (body.priority as MaintenancePriority) || 'Sedang';
    const target_date = String(body.target_date || '2026-12-05');

    if (!asset_id || !issue_description) {
      throw new Error('Aset dan deskripsi kerusakan wajib diisi.');
    }
    const asset = db.assets.find((a) => a.id === asset_id);
    if (!asset) throw new Error('Aset tidak ditemukan.');
    if (allowedIds !== null && !allowedIds.includes(asset.recorded_location_id)) {
      throw new Error('Aset di luar wilayah tugas Anda.');
    }

    const id = nextId(db.maintenance_tickets);
    const ticket_code = `MNT-2026-${String(db.maintenance_tickets.length + 1).padStart(3, '0')}`;
    const ts = nowTimestamp();
    db.maintenance_tickets.push({
      id,
      ticket_code,
      asset_id: asset.id,
      reported_by_user_id: currentUser.id,
      assigned_pic,
      issue_description,
      priority,
      target_date,
      status: 'Terbuka',
      resolution_notes: null,
      repair_photo_url: null,
      created_at: ts,
      updated_at: ts,
    });
    logAudit(
      db,
      currentUser.id,
      'BUAT_TIKET_PEMELIHARAAN',
      'asset',
      asset.asset_id,
      `Membuat tiket pemeliharaan ${ticket_code} untuk ${asset.asset_id} (${asset.name}).`
    );
    saveDb(db);
    return { id, ticket_code } as T;
  }

  const mntMatch = pathname.match(/^\/maintenance\/(\d+)$/);
  if (mntMatch && method === 'PATCH') {
    requirePermission(currentUser, 'maintenance:manage');
    const id = Number(mntMatch[1]);
    const existing = db.maintenance_tickets.find((t) => t.id === id);
    if (!existing) throw new Error('Tiket tidak ditemukan.');

    if (body.status) existing.status = body.status as MaintenanceStatus;
    if (body.assigned_pic !== undefined) existing.assigned_pic = String(body.assigned_pic);
    if (body.resolution_notes !== undefined) {
      existing.resolution_notes = body.resolution_notes ? String(body.resolution_notes) : null;
    }
    if (body.target_date) existing.target_date = String(body.target_date);
    existing.updated_at = nowTimestamp();

    logAudit(
      db,
      currentUser.id,
      'UPDATE_TIKET_PEMELIHARAAN',
      'maintenance_ticket',
      existing.ticket_code,
      `Memperbarui tiket ${existing.ticket_code} menjadi status "${existing.status}".`
    );
    saveDb(db);
    return { ok: true } as T;
  }

  // --- LOCATIONS & USERS ---
  if (pathname === '/locations' && method === 'GET') {
    const byId = new Map(db.locations.map((l) => [l.id, l]));
    const locations = db.locations.map((l) => ({
      ...l,
      parent_name: l.parent_id ? byId.get(l.parent_id)?.name || null : null,
    }));
    return { locations } as T;
  }

  if (pathname === '/locations' && method === 'POST') {
    requirePermission(currentUser, 'locations:manage');
    const code = String(body.code || '').trim().toUpperCase();
    const name = String(body.name || '').trim();
    const type = String(body.type || '') as LocationType;
    const parent_id = body.parent_id ? Number(body.parent_id) : null;

    if (!code || !name || !type) {
      throw new Error('Kode, nama, dan tipe lokasi wajib diisi.');
    }
    if (db.locations.some((l) => l.code === code)) {
      throw new Error('Kode lokasi sudah digunakan.');
    }
    const id = nextId(db.locations);
    db.locations.push({ id, code, name, type, parent_id });
    logAudit(
      db,
      currentUser.id,
      'TAMBAH_LOKASI',
      'location',
      code,
      `Menambahkan lokasi baru "${name}" (${type}).`
    );
    saveDb(db);
    return { id } as T;
  }

  if (pathname === '/roles' && method === 'GET') {
    return { roles: db.roles } as T;
  }

  if (pathname === '/users' && method === 'GET') {
    const users = db.users
      .map((u) => loadUserWithRole(db, u.id))
      .filter((u): u is UserAccount => Boolean(u));
    return { users } as T;
  }

  if (pathname === '/users' && method === 'POST') {
    requirePermission(currentUser, 'users:manage');
    const name = String(body.name || '').trim();
    const employee_id = String(body.employee_id || '').trim();
    const location_id = Number(body.location_id);
    const role_id = Number(body.role_id);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || 'assetin2026');

    if (!name || !employee_id || !location_id || !role_id || !email) {
      throw new Error('Semua data petugas wajib diisi.');
    }
    if (db.users.some((u) => u.employee_id === employee_id || u.email === email)) {
      throw new Error('NIP atau Email sudah terdaftar pada sistem.');
    }
    const id = nextId(db.users);
    db.users.push({
      id,
      name,
      employee_id,
      location_id,
      role_id,
      email,
      password,
      status: 'Aktif',
    });
    logAudit(
      db,
      currentUser.id,
      'TAMBAH_PENGGUNA',
      'user',
      employee_id,
      `Menambahkan akun petugas "${name}" (${email}).`
    );
    saveDb(db);
    return { id } as T;
  }

  const userPatchMatch = pathname.match(/^\/users\/(\d+)$/);
  if (userPatchMatch && method === 'PATCH') {
    requirePermission(currentUser, 'users:manage');
    const id = Number(userPatchMatch[1]);
    const existing = db.users.find((u) => u.id === id);
    if (!existing) throw new Error('Pengguna tidak ditemukan.');

    if (body.status) existing.status = body.status as 'Aktif' | 'Nonaktif';
    if (body.role_id) existing.role_id = Number(body.role_id);
    if (body.location_id) existing.location_id = Number(body.location_id);

    logAudit(
      db,
      currentUser.id,
      'UBAH_PENGGUNA',
      'user',
      existing.employee_id,
      `Memperbarui peran/status akun ${existing.name}.`
    );
    saveDb(db);
    return { ok: true } as T;
  }

  // --- REPORTS ---
  if (pathname === '/reports/summary' && method === 'GET') {
    requirePermission(currentUser, 'reports:export');
    const periodParam = params.get('periodId');
    const targetPeriodId = periodParam ? Number(periodParam) : activePeriodId;
    const locationId = params.get('locationId');
    const condition = params.get('condition');

    const scopedRaw = (
      allowedIds === null
        ? db.assets
        : db.assets.filter((a) => allowedIds.includes(a.recorded_location_id))
    ).sort((a, b) => a.id - b.id);

    let enriched = enrichAssets(db, scopedRaw, targetPeriodId);

    if (locationId && locationId !== 'ALL') {
      const targetLocId = Number(locationId);
      const targetLoc = db.locations.find((l) => l.id === targetLocId);
      let matchIds = [targetLocId];
      if (targetLoc?.type === 'Kecamatan') {
        matchIds = db.locations
          .filter((l) => l.id === targetLocId || (l.type === 'Ruang' && l.parent_id === targetLocId))
          .map((l) => l.id);
      } else if (targetLoc?.type === 'Kelurahan') {
        matchIds = db.locations
          .filter((l) => l.id === targetLocId || l.parent_id === targetLocId)
          .map((l) => l.id);
      }
      enriched = enriched.filter((a) => matchIds.includes(a.recorded_location_id));
    }
    if (condition && condition !== 'ALL') {
      enriched = enriched.filter(
        (a) => (a.latest_condition_status || a.recorded_condition) === condition
      );
    }

    return {
      rows: enriched,
      periods: [...db.census_periods].sort((a, b) => b.id - a.id),
    } as T;
  }

  // --- SETTINGS ---
  if (pathname === '/settings' && method === 'GET') {
    const periods = [...db.census_periods].sort((a, b) => b.id - a.id);
    const auditLogs = enrichAuditLogs(
      db,
      [...db.audit_logs].sort((a, b) => b.id - a.id).slice(0, 50)
    );
    const serialized = JSON.stringify(db);
    return {
      periods,
      auditLogs,
      dbSizeBytes: new Blob([serialized]).size,
    } as T;
  }

  if (pathname === '/settings/periods' && method === 'POST') {
    if (
      !currentUser.permissions.includes('settings:manage') &&
      !currentUser.permissions.includes('settings:periods')
    ) {
      throw new Error('Akses ditolak.');
    }
    const code = String(body.code || '').trim().toUpperCase();
    const name = String(body.name || '').trim();
    const year = Number(body.year) || 2027;
    const start_date = String(body.start_date || '2027-01-05');
    const end_date = String(body.end_date || '2027-03-31');
    const activate = Boolean(body.activate);

    if (!code || !name) throw new Error('Kode dan nama periode wajib diisi.');
    if (activate) {
      for (const p of db.census_periods) {
        if (p.status === 'Aktif') p.status = 'Ditutup';
      }
    }
    const id = nextId(db.census_periods);
    db.census_periods.push({
      id,
      code,
      name,
      year,
      start_date,
      end_date,
      status: activate ? 'Aktif' : 'Draft',
      notes: null,
    });
    logAudit(
      db,
      currentUser.id,
      'BUAT_PERIODE_SENSUS',
      'census_period',
      String(id),
      `Membuat periode sensus "${name}" (${activate ? 'Aktif' : 'Draft'}).`
    );
    saveDb(db);
    return { id } as T;
  }

  const periodMatch = pathname.match(/^\/settings\/periods\/(\d+)$/);
  if (periodMatch && method === 'PATCH') {
    if (
      !currentUser.permissions.includes('settings:manage') &&
      !currentUser.permissions.includes('settings:periods')
    ) {
      throw new Error('Akses ditolak.');
    }
    const id = Number(periodMatch[1]);
    const status = String(body.status || '') as CensusPeriodStatus;
    const target = db.census_periods.find((p) => p.id === id);
    if (!target) throw new Error('Periode sensus tidak ditemukan.');

    if (status === 'Aktif') {
      for (const p of db.census_periods) {
        if (p.id !== id && p.status === 'Aktif') p.status = 'Ditutup';
      }
    }
    target.status = status;
    logAudit(
      db,
      currentUser.id,
      'UBAH_STATUS_PERIODE',
      'census_period',
      String(id),
      `Mengubah status periode "${target.name}" menjadi ${status}.`
    );
    saveDb(db);
    return { ok: true } as T;
  }

  if (pathname === '/settings/backup' && method === 'GET') {
    requirePermission(currentUser, 'settings:manage');
    return {
      exported_at: nowTimestamp(),
      app: 'ASSET-IN Kecamatan Taman (Client Mock Store)',
      data: db,
    } as T;
  }

  throw new Error(`Endpoint lokal tidak dikenali: ${method} ${pathname}`);
}
