import {
    generateUserEmailSlug,
    normalizeVietnamese,
    splitFullName,
} from "../lib/utils/names";

async function runVerification() {
    console.log("=== Verifying Quick Add Logic ===\n");

    const testNames = [
        "NguyềE Cao Quốc Bảo",
        "Trần ThềEKim Liên",
        "Lê Văn Tám",
        "Phạm Minh Chính",
        "Đặng DiềE Quỳnh",
    ];

    console.log("--- Name Splitting & Email Slugs ---");
    testNames.forEach((name) => {
        const { first_name, last_name } = splitFullName(name);
        const slug = generateUserEmailSlug(name);
        console.log(`Input: "${name}"`);
        console.log(`  Split: First="${first_name}", Last="${last_name}"`);
        console.log(`  Email Slug: "${slug}"`);
        console.log(`  Final candidate: "${slug}@bhedu.vn"\n`);
    });

    console.log("--- Role-Based Domain Logic ---");
    const roles = ["admin", "staff", "teacher", "parent", "student"];
    const baseName = "NguyềE Cao Quốc Bảo";
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
        "\nLogic check for 'NguyềE Cao Quốc Bảo' -> 'baoncq@bhedu.vn':",
    );
    const expected = "baoncq";
    if (slug === expected) {
        console.log("✁ESUCCESS: Slug matches expectations.");
    } else {
        console.log(`❁EFAILURE: Expected '${expected}', got '${slug}'`);
    }
}

runVerification().catch(console.error);

