#!/bin/bash

##############################################
# Student CRUD Migration Application Script
# Applies migrations 044, 045, 046 to Supabase
##############################################

set -e  # Exit on error

echo "🚀 Student CRUD Database Migration Script"
echo "=========================================="
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo ""
    echo "Please install it first:"
    echo "  npm install -g supabase"
    echo ""
    echo "Or apply migrations manually via Supabase Dashboard"
    exit 1
fi

# Check if we're in the right directory
if [ ! -d "supabase/migrations" ]; then
    echo "❌ Error: supabase/migrations directory not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "📁 Found migrations directory"
echo ""

# Check if migration files exist
MIGRATION_044="supabase/migrations/044_student_management_schema.sql"
MIGRATION_045="supabase/migrations/045_student_management_rls.sql"
MIGRATION_046="supabase/migrations/046_student_management_functions.sql"

if [ ! -f "$MIGRATION_044" ]; then
    echo "❌ Missing: $MIGRATION_044"
    exit 1
fi

if [ ! -f "$MIGRATION_045" ]; then
    echo "❌ Missing: $MIGRATION_045"
    exit 1
fi

if [ ! -f "$MIGRATION_046" ]; then
    echo "❌ Missing: $MIGRATION_046"
    exit 1
fi

echo "✅ All migration files found"
echo ""

# Check if linked to Supabase project
echo "🔗 Checking Supabase project link..."
if ! supabase status &> /dev/null; then
    echo "⚠️  Not linked to a Supabase project"
    echo ""
    read -p "Enter your Supabase project ref (or 'skip' to apply manually): " PROJECT_REF
    
    if [ "$PROJECT_REF" == "skip" ]; then
        echo ""
        echo "📋 Manual application steps:"
        echo ""
        echo "1. Go to your Supabase Dashboard"
        echo "2. Navigate to SQL Editor"
        echo "3. Apply these files in order:"
        echo "   - $MIGRATION_044"
        echo "   - $MIGRATION_045"
        echo "   - $MIGRATION_046"
        echo ""
        exit 0
    fi
    
    echo "🔗 Linking to project..."
    supabase link --project-ref "$PROJECT_REF"
fi

echo "✅ Project linked"
echo ""

# Confirm before applying
echo "⚠️  About to apply the following migrations:"
echo "  1. 044_student_management_schema.sql   (Schema enhancements)"
echo "  2. 045_student_management_rls.sql      (RLS policies)"
echo "  3. 046_student_management_functions.sql (Helper functions)"
echo ""
read -p "Continue? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "❌ Aborted"
    exit 0
fi

echo ""
echo "🚀 Applying migrations..."
echo ""

# Apply migrations
echo "📝 Applying 044_student_management_schema.sql..."
supabase db push --include-all

echo ""
echo "✅ Migrations applied successfully!"
echo ""

# Verify migrations
echo "🔍 Verifying migrations..."
echo ""

# You could add verification queries here if needed
# For now, just show status
supabase db remote list

echo ""
echo "🎉 Student CRUD database setup complete!"
echo ""
echo "Next steps:"
echo "1. Verify in Supabase Dashboard → Database → Tables"
echo "2. Check that profiles table has new columns"
echo "3. Test the API endpoints"
echo ""
echo "See README_STUDENT_MIGRATIONS.md for verification queries"
echo ""
