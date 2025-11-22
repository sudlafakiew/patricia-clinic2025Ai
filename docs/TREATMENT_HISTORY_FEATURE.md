# Treatment History & Purchase History Feature

## Overview

This document describes the newly added **Treatment History** and **Purchase History** features for the Patricia Clinic Manager. These features allow clinic staff to:

1. **Record treatments** for each customer with before/after photos and details
2. **View complete treatment history** with timestamps, doctor information, and photo galleries
3. **Track purchase history** for each customer (transactions and courses)

## Features Added

### 1. Treatment Record Management

#### Adding a Treatment Record

In the **Customer Details** view, click the **บันทึกการรักษา** (Record Treatment) button to open the treatment form.

**Form Fields:**
- **ชื่อหัตถการ** (Treatment Name): Name of the treatment/procedure
- **รายละเอียด** (Details): Clinical notes or diagnosis information
- **แพทย์** (Doctor): Name of the attending physician
- **จำนวนครั้งที่ใช้** (Units Used): How many units/sessions were consumed
- **รูปก่อน / หลัง** (Before/After Photos): Multi-select image upload for progress documentation

#### Data Persistence

Treatment records are stored in the `treatment_records` table with:
- `id`: Unique identifier
- `customer_id`: Link to the customer
- `date`: Timestamp of the treatment
- `treatment_name`: Type of treatment
- `details`: Clinical notes
- `doctor_name`: Attending doctor
- `units_used`: Number of units/sessions used
- `doctor_fee`: Commission/fee amount (optional)
- `photos`: Array of photo URLs (if using optional migration)

#### Photo Storage

Photos are automatically uploaded to Supabase Storage (`treatment-photos` bucket) with a path structure:
```
customers/{customerId}/{timestamp}_{index}_{filename}
```

**Note:** The app works without the storage bucket—photos can be uploaded manually or skipped entirely. For production use with persistent photo storage, create the bucket and run the migration in `migrations/add_treatment_photos_and_storage.sql`.

### 2. Treatment History View

In the customer detail view, the **ประวัติการรักษา** (Treatment History) section displays a table with:

| Column | Content |
|--------|---------|
| วันที่ (Date) | Treatment date in YYYY-MM-DD format |
| รายการ (Item) | Treatment name |
| รายละเอียด (Details) | Clinical notes or diagnosis |
| แพทย์ (Doctor) | Attending physician |
| รูปภาพ (Photos) | Thumbnail gallery of before/after photos |
| การใช้งาน (Usage) | Units consumed (e.g., "-2 ครั้ง") |

Photos appear as clickable thumbnails, allowing for quick visual assessment of treatment progress.

### 3. Purchase History View

Below the treatment history, the **ประวัติการสั่งซื้อ** (Purchase History) section shows all transactions for the customer:

| Column | Content |
|--------|---------|
| วันที่ (Date) | Transaction date |
| รายการ (Items) | List of purchased services/courses (e.g., "2x ฟิสิโอเทราพี") |
| รวม (Total) | Total amount paid |
| ช่องทางชำระ (Payment Method) | Cash, Credit Card, or Transfer |

This provides a complete record of all services and courses the customer has purchased.

## Implementation Details

### Frontend Components

**File:** `components/CustomerPage.tsx`

- **New State Variables:**
  - `isAddTreatmentModalOpen`: Controls treatment form visibility
  - `treatmentForm`: Form data (name, details, doctor, units)
  - `treatmentPhotos`: File array for uploaded photos
  - `photoPreviews`: Preview URLs for image selection

- **New Handler Functions:**
  - `handleTreatmentPhotoChange()`: Processes multi-file image selection
  - `handleAddTreatmentSubmit()`: Validates and submits treatment record
  - Opens via "บันทึกการรักษา" button in customer detail header

- **UI Elements:**
  - Treatment form modal with file input and image previews
  - Treatment history table with photo gallery column
  - Purchase history table below treatment history

### Backend / Context

**File:** `context/ClinicContext.tsx`

- **New Function:** `addTreatmentRecord(customerId, record)`
  - Uploads photos to Supabase Storage if provided
  - Inserts treatment record into `treatment_records` table
  - Falls back gracefully if photos column doesn't exist on DB
  - Returns success/failure boolean

- **Enhanced Data Loading:**
  - `refreshData()` now fetches `treatment_records` for each customer
  - Maps database fields to TypeScript interfaces
  - Populated `treatmentHistory` array in Customer object

- **Database Integration:**
  - Reads photos URLs from DB if available
  - Maps `doctor_fee` to `doctorFee` field
  - Graceful handling of missing photos column

### Types

**File:** `types.ts`

```typescript
export interface TreatmentRecord {
  id: string;
  date: string;
  treatmentName: string;
  details: string;
  doctorName: string;
  doctorFee?: number;
  unitsUsed: number;
  photos: string[]; // Array of photo URLs
}
```

## Database Setup

### Minimal Setup (No Photos)
The feature works out-of-the-box with the existing `treatment_records` table. No additional migration needed.

### Recommended Setup (With Photo Persistence)
To persistently store photo URLs, run the optional migration:

```sql
-- Run in Supabase SQL Editor:
ALTER TABLE treatment_records ADD COLUMN photos text[] DEFAULT '{}';
```

### Storage Bucket Setup

1. **Create Bucket in Supabase:**
   - Go to Dashboard > Storage
   - Create new bucket: `treatment-photos`
   - Make public or add RLS policies as needed

2. **Example RLS Policy (Public Read):**
   ```sql
   CREATE POLICY "Public can view treatment photos"
     ON storage.objects FOR SELECT
     USING (bucket_id = 'treatment-photos');
   ```

3. **Example RLS Policy (Authenticated Upload):**
   ```sql
   CREATE POLICY "Authenticated users can upload"
     ON storage.objects FOR INSERT
     WITH CHECK (
       bucket_id = 'treatment-photos'
       AND auth.role() = 'authenticated'
     );
   ```

## Usage Workflow

### Recording a Treatment

1. Navigate to **ทะเบียนลูกค้า** (CRM)
2. Click on a customer to view details
3. Click **บันทึกการรักษา** button
4. Fill in:
   - Treatment name (e.g., "หัตถการปรับปรุงผิว")
   - Clinical details
   - Doctor name
   - Number of units used
   - Upload before/after photos (optional)
5. Click **บันทึกการรักษา** to save
6. Photos are uploaded to storage and linked to the record

### Viewing History

1. In customer details, scroll to **ประวัติการรักษา** section
2. View all past treatments with:
   - Treatment names and dates
   - Doctor information
   - Photo galleries (thumbnails)
   - Units consumed
3. Scroll further to see **ประวัติการสั่งซื้อ** (Purchase History)

## Error Handling

### Photo Upload Failures
- If a photo fails to upload, the treatment record is still created
- Warnings are logged to browser console
- User is notified if the core record insertion fails

### Database Column Missing
- If `photos` column doesn't exist, record inserts without photos
- Photos are still uploaded to storage (if bucket exists)
- User sees warning in console about DB migration

### Storage Bucket Missing
- If `treatment-photos` bucket doesn't exist, photos are skipped
- Treatment record is created without photo URLs
- No error shown to user (graceful degradation)

## Future Enhancements

1. **Photo Gallery Modal:** Click thumbnails to view full-size before/after galleries
2. **Treatment Templates:** Pre-defined treatment types with standard fields
3. **Progress Analytics:** Compare before/after photos side-by-side with timelines
4. **Export to PDF:** Generate treatment history reports with photos
5. **Multiple Doctors:** Assignment and tracking of commission splits
6. **Follow-up Scheduling:** Link treatments to upcoming appointments

## Testing Checklist

- [ ] Record a treatment with all fields filled
- [ ] Record a treatment without photos
- [ ] Verify photos appear as thumbnails in history
- [ ] Record a treatment with multiple photos
- [ ] Verify purchase history shows correct transactions
- [ ] Test with missing photos column (graceful fallback)
- [ ] Verify Supabase RLS policies allow/block as expected
- [ ] Test treatment creation for non-admin users (if POS flow enabled)

## File Changes Summary

| File | Changes |
|------|---------|
| `components/CustomerPage.tsx` | Added treatment modal UI, form handlers, treatment/purchase history tables |
| `context/ClinicContext.tsx` | Added `addTreatmentRecord()` function, enhanced `refreshData()` |
| `types.ts` | Already includes `TreatmentRecord` interface with photos |
| `migrations/add_treatment_photos_and_storage.sql` | Optional: Adds photos column to treatment_records |

## Troubleshooting

**Q: Photos won't upload**
- Check that `treatment-photos` bucket exists in Supabase Storage
- Verify storage bucket RLS policies allow INSERT
- Check browser console for upload errors

**Q: Treatment records not saving**
- Check that `treatment_records` table exists (run DatabaseSetupGuide)
- Verify user has permission via RLS (backend allows insert)
- Check browser console for database errors

**Q: Photos don't show in history table**
- If using DB storage: run optional migration for photos column
- Check that photos uploaded successfully (check Supabase Storage console)
- Verify URLs are public (check storage bucket policies)

**Q: Photos uploaded but not linked in DB**
- This is expected if photos column doesn't exist
- Run optional migration to persist photo URLs
- Photos still exist in storage, just not queryable from DB

