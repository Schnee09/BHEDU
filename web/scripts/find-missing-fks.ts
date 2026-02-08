import * as fs from "fs";

const defs = JSON.parse(fs.readFileSync("schema_definitions.json", "utf8"));
const potentialMissingFKs: any[] = [];

for (const [table, def] of Object.entries(defs) as any) {
    if (!def.properties) continue;
    for (const [column, prop] of Object.entries(def.properties) as any) {
        if (column.endsWith("_id") && column !== "id") {
            const description = prop.description || "";
            if (!description.includes("<fk")) {
                potentialMissingFKs.push({
                    table,
                    column,
                    type: prop.format || prop.type,
                });
            }
        }
    }
}

fs.writeFileSync(
    "potential_missing_fks.json",
    JSON.stringify(potentialMissingFKs, null, 2),
);
console.log(`Found ${potentialMissingFKs.length} potential missing FKs.`);
potentialMissingFKs.forEach((fk) => console.log(`- ${fk.table}.${fk.column}`));
