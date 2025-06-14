# Database Migration Guide

## Fixing Database Column Issues

### Issue 1: "column 'isEmailVerified' does not exist" Error

If you encounter the error "column 'isEmailVerified' does not exist" during signup or login, you need to run a database script to add the missing email verification columns to your database.

### Issue 2: "column 'phoneNumber' does not exist" Error

If you encounter the error "column 'phoneNumber' does not exist" during signup, you need to run a different script that adds all missing user profile columns.

### Issue 3: "column 'roleId' does not exist" Error

If you encounter the error "column 'roleId' does not exist" during signup, we've updated the fix script to also create the roles table and add the roleId column to the users table.

## Running the Fixes

1. Make sure your PostgreSQL database is running
2. Navigate to the backend directory:
   ```
   cd lead-generation-backend
   ```
3. Install the dependencies (if you haven't already):
   ```
   npm install
   ```

### Option 1: Run the Comprehensive Fix Script (Recommended)

This will fix all known database issues in one go:

```
npm run fix-all
```

### Option 2: Run Individual Fix Scripts

If you prefer to run the fixes individually:

1. For email verification columns only:
   ```
   npm run fix-db
   ```

2. For all missing user columns (including phoneNumber, roleId, etc.):
   ```
   npm run fix-user-columns
   ```

3. To assign the default 'user' role to existing users:
   ```
   npm run update-user-roles
   ```

## What the Fixes Do

### The comprehensive fix-all script:
1. Adds all missing columns to the users table
2. Creates the roles table if it doesn't exist
3. Inserts default roles (user, admin, super_admin)
4. Assigns the default 'user' role to any users without a role

### The individual scripts:

#### The fix-db script adds:
- `isEmailVerified` - A boolean column indicating whether the user's email has been verified
- `emailVerificationToken` - A string column to store the token used for email verification
- `emailVerificationExpires` - A date column to store when the verification token expires

#### The fix-user-columns script adds all potentially missing columns and tables:
- All email verification columns (listed above)
- `phoneNumber` - For storing user phone numbers
- `photo` - For storing user profile photo URLs
- `linkedinId` - For LinkedIn integrations
- `address` - For user address information
- `resetPasswordToken` - For password reset functionality
- `resetPasswordExpires` - For password reset token expiration
- `roleId` - Foreign key to link users to their roles
- Creates the roles table if it doesn't exist, with default user roles

#### The update-user-roles script:
- Finds or creates the default 'user' role
- Assigns this role to any existing users that don't have a role assigned

## Verifying the Fix

After running the scripts, you should see confirmation messages for each step.

You should now be able to sign up and log in without encountering the error.

## Troubleshooting

If you still encounter issues after running the fixes:

1. Check your database connection settings in the `.env` file
2. Make sure the PostgreSQL service is running
3. Verify that the columns were added by looking at the database table structure
4. If PostgreSQL isn't running, start it before running the fix script

### Checking Column Existence Manually

You can check if the columns were added correctly by running the following SQL queries in your PostgreSQL client:

```sql
-- Check user table columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users';

-- Check roles table
SELECT * FROM roles;

-- Check user-role relationships
SELECT u.id, u.name, u.email, r.name as role_name
FROM users u
LEFT JOIN roles r ON u."roleId" = r.id;
```

If problems persist, you may need to manually add the columns to your database or contact the system administrator for assistance. 