import {
    generateUserEmailSlug,
    normalizeVietnamese,
    splitFullName,
} from "../lib/utils/names";

async function runVerification() {
    console.log("=== Verifying Quick Add Logic ===\n");

    const testNames = [
        "Nguyễn Cao Quốc Bảo",
        "Trần Thị Kim Liên",
        "Lê Văn Tám",
        "Phạm Minh Chính",
        "Đặng Diễm Quỳnh",
    ];

    console.log("--- Name Splitting & Email Slugs ---");
    testNames.forEach((name) => {
        const { firstName, lastName } = splitFullName(name);
        const slug = generateUserEmailSlug(name);
        console.log(`Input: "${name}"`);
        console.log(`  Split: First="${firstName}", Last="${lastName}"`);
        console.log(`  Email Slug: "${slug}"`);
        console.log(`  Final candidate: "${slug}@bhedu.vn"\n`);
    });

    console.log("--- Role-Based Domain Logic ---");
    const roles = ["admin", "staff", "teacher", "parent", "student"];
    const baseName = "Nguyễn Cao Quốc Bảo";
    const slug = generateUserEmailSlug(baseName);

    roles.forEach((role) => {
        let domain = "@bhedu.vn";
        if (role === "student") domain = "@student.bhedu.vn";
        else if (role === "parent") domain = "@parent.bhedu.vn";

        const email = role === "student"
            ? "HS20260001@student.bhedu.vn"
            : `${slug}${domain}`;
        console.log(`Role: ${role.padEnd(8)} -> Email: ${email}`);
    });

    console.log("\n--- Collision Handling Logic (Simulation) ---");
    const candidates = [];
    let candidate = `${slug}@bhedu.vn`;
    candidates.push(candidate);
    console.log(`1st attempt: ${candidate} (exists)`);

    let counter = 2;
    candidate = `${slug}${counter}@bhedu.vn`;
    candidates.push(candidate);
    console.log(`2nd attempt: ${candidate} (exists)`);

    counter++;
    candidate = `${slug}${counter}@bhedu.vn`;
    candidates.push(candidate);
    console.log(`3rd attempt: ${candidate} (available)`);

    console.log(
        "\nLogic check for 'Nguyễn Cao Quốc Bảo' -> 'baoncq@bhedu.vn':",
    );
    const expected = "baoncq";
    if (slug === expected) {
        console.log("✅ SUCCESS: Slug matches expectations.");
    } else {
        console.log(`❌ FAILURE: Expected '${expected}', got '${slug}'`);
    }
}

runVerification().catch(console.error);
