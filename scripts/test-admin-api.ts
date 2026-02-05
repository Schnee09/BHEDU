import { createServiceClient } from "../web/lib/supabase/server";
import { UserService } from "../web/lib/services/userService";

async function testAdminApiRefactor() {
    console.log("--- Testing Admin API Refactor Logic ---");

    const supabase = createServiceClient();
    const userService = new UserService(supabase);

    try {
        console.log(
            "1. Testing student creation without email (auto-gen requested)...",
        );
        const result = await userService.createUser({
            full_name: "Test Student No Email",
            role: "student",
            grade_level: "Lớp 12",
        } as any, "admin");

        console.log("✅ Success! Student created:");
        console.log(`   - Full Name: ${result.full_name}`);
        console.log(`   - Email: ${result.email}`);
        console.log(`   - Code: ${result.student_code}`);
        console.log(`   - Temp Password: ${result.tempPassword}`);

        // Clean up
        console.log("2. Cleaning up test student...");
        await supabase.auth.admin.deleteUser(result.user_id);
        await supabase.from("profiles").delete().eq("id", result.id);
        console.log("✅ Cleaned up.");
    } catch (error: any) {
        console.error("❌ Test failed:", error.message);
        if (error.details) console.error("Details:", error.details);
    }
}

testAdminApiRefactor();
