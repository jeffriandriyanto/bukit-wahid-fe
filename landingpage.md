## API Contract & Database Schema - CMS RW 11

### Landing Page Module

#### 1. General Information (GET, PUT)

Table: settings (atau site_informations)
| Field | Laravel Migration Type | Note |
| :--- | :--- | :--- |
| hero_img | string | URL Image Utama |
| hero_alt | string | Alt text untuk SEO |
| location | string | Alamat lengkap |
| secretariat | string | Alamat sekretariat |
| whatsapp | string | No WA |
| email | string | |
| logo | string | URL Logo |
| welcome_image | string | Foto sambutan |
| welcome_description | text | Long text |
| socials | json | Simpan sebagai JSON: {instagram, x, youtube, facebook} |

#### 2. Galleries (Array/CRUD)

| Field | Laravel Migration Type | Note |
| :--- | :--- | :--- |
| img | string | |
| alt | string | |
| description | text | Long text |

#### 3. Announcements (GET)

| Field | Laravel Migration Type | Note |
| :--- | :--- | :--- |
| title | string | |
| slug | string | Unique, generated from title |
| image | string | |
| published_at | date | |
| author_name | string | |

#### 4. Agenda (GET)

| Field | Laravel Migration Type | Note |
| :--- | :--- | :--- |
| title | string | |
| location | string | |
| description | text | Long text |
| start_date | date | |
| start_time | time | |
| fors | json | Array of object: [{id, name}] |

#### 5. Transactions (CRUD)

| Field | Laravel Migration Type | Note |
| :--- | :--- | :--- |
| id | uuid atau bigIncremental | Primary Key |
| citizen_name | string | Nama pembayar |
| amount | decimal(12,2) | Gunakan Decimal untuk uang |
| type | string | Misal: "Iuran Bulanan" |
| status | enum | ['Lunas', 'Pending'] |
| payment_date | date | Nullable |
| period | string | Misal: "Februari 2026" |
| note | text | |

#### 5. Apparatus / Pengurus (GET)

| Field | Laravel Migration Type | Note |
| :--- | :--- | :--- |
| name | string | |
| role | string | |
| photo | string | |

#### 6. Work Programs (CRUD)

| Field | Laravel Migration Type | Note |
| :--- | :--- | :--- |
| category | string | Jangka Pendek/Panjang |
| work_program| string | Nama program |
| duration | string | |
| pic | string | Person in charge |
| details | json | Array list of strings |
