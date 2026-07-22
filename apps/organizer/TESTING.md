# Testing the DEGES Organizer Platform

## Starting the Development Server

```bash
# From monorepo root
bun run dev

# Or just the organizer app
cd apps/organizer
bun run dev
```

The app will be available at **http://localhost:3000** (or next available port)

---

## Testing Onboarding

### Direct Access (Recommended for Testing)
Navigate to: **http://localhost:3000/organizer/onboarding**

### Full Flow with Authentication
1. Go to **http://localhost:3000** (login)
2. Login with valid credentials (requires backend API)
3. Will redirect to `/organizer` 
4. Guard will redirect to `/organizer/onboarding` if not complete

---

## Sample Test Data

### Step 1: Profile Information
```
Full Name: Abebe Bekele
Phone: +251911234567 (or 0911234567)
National ID: ET123456789
Email: abebe@deges.et
Password: Test1234!
Confirm Password: Test1234!
```

### Step 2: Business Details
```
License File: [Upload any PDF/JPG/PNG, optional]
TIN: 1234567890
Bank Name: Commercial Bank of Ethiopia
Account Number: 1000123456789
Address: Kirkos Subcity, Addis Ababa, Ethiopia
```

### Step 3: Experience
```
Event Types: ✓ Concert, ✓ Festival, ✓ Conference
Audience Size: Medium (100-500)
Event Frequency: Regularly (4-12 per year)
```

### Step 4: Preferences
```
Payout Method: Bank Transfer
Support Options: ✓ Email Support, ✓ Phone Support
Use QR Scanner: ON
```

### Step 5: Agreement
```
✓ I agree to the Terms and Conditions
✓ I acknowledge the service fees
✓ I confirm the accuracy of my information
```

Click **"Complete Registration"**

---

## Browser Console Commands

### Check if Onboarding is Complete
```javascript
const account = JSON.parse(localStorage.getItem('organizerAccount') || 'null')
console.log('Onboarding Complete:', !!account?.completedAt)
console.log('Account Data:', account)
```

### Reset Onboarding (Start Fresh)
```javascript
localStorage.removeItem('organizerAccount')
console.log('Onboarding data cleared. Refresh page.')
```

### Set Fake Completed Onboarding (Skip to Dashboard)
```javascript
const fakeAccount = {
  fullName: "Test Organizer",
  email: "test@deges.et",
  phone: "+251911234567",
  completedAt: new Date().toISOString(),
  // ... add other fields as needed
}
localStorage.setItem('organizerAccount', JSON.stringify(fakeAccount))
console.log('Fake account created. Go to /organizer')
```

---

## Expected Behaviors

### ✅ Success Cases
- All validation errors show in real time
- Can't proceed without filling required fields
- File upload shows file name after selection
- Progress bar updates as you move through steps
- Success toast appears on completion
- Auto-redirect to `/organizer` dashboard after 1.5s

### ⚠️ Validation Rules
- **Phone**: Must match Ethiopian format (+251 or 0 followed by 9 digits)
- **Password**: Min 8 characters
- **Passwords**: Must match
- **TIN**: Min 10 characters
- **Event Types**: At least 1 selected
- **Support Options**: At least 1 selected
- **License File**: Max 10MB (optional)
- **All Agreements**: Must check all 3 boxes

### 🔄 Navigation
- **Back button**: Returns to previous step (data preserved)
- **Continue button**: Only enabled when step is valid
- **Final step**: Shows "Complete Registration" instead of "Continue"
- **After completion**: Can't access onboarding page (redirects to dashboard)

---

## Troubleshooting

### Onboarding Keeps Redirecting to Dashboard
**Cause**: `organizerAccount` already exists in localStorage with `completedAt`  
**Solution**: 
```javascript
localStorage.removeItem('organizerAccount')
// Then refresh
```

### Dashboard Keeps Redirecting to Onboarding
**Cause**: No `organizerAccount` in localStorage or missing `completedAt`  
**Solution**: Complete the onboarding flow or set fake data (see console commands above)

### Form Validation Not Working
**Check**: Make sure you're entering data in correct format
- Phone: `+251912345678` or `0912345678`
- Email: Valid email format
- Password: At least 8 characters

### File Upload Not Working
**Check**: 
- File size under 10MB
- File type is PDF, JPG, JPEG, or PNG
- Check browser console for errors

---

## Testing Checklist

- [ ] Can access onboarding page directly
- [ ] Step 1: All fields validate correctly
- [ ] Step 1: Password confirmation works
- [ ] Step 2: File upload shows file name
- [ ] Step 2: Bank dropdown has options
- [ ] Step 3: Can select multiple event types
- [ ] Step 3: Dropdowns work
- [ ] Step 4: Can select multiple support options
- [ ] Step 4: QR scanner switch toggles
- [ ] Step 5: All three checkboxes required
- [ ] Progress bar updates on each step
- [ ] Back button preserves data
- [ ] Can't submit with invalid data
- [ ] Success toast shows on completion
- [ ] Redirects to dashboard after completion
- [ ] Can't access onboarding after completion
- [ ] Dashboard accessible after completion

---

## API Integration Notes

Currently, the onboarding saves to **localStorage only**.

To integrate with your backend API:
1. Update `apps/organizer/app/organizer/onboarding/page.tsx`
2. In the `handleSubmit` function, replace localStorage save with API call
3. Use RTK Query mutation from `@workspace/store` (similar to login)

Example:
```typescript
// In handleSubmit function
const response = await createOrganizerMutation(organizerAccount).unwrap()
// Then save response to localStorage or context
```
