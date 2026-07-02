import os
import sys
import subprocess
import json

def run_command(command, cwd=None):
    try:
        # Read raw bytes and decode manually to handle UTF-8/emoji output safely on Windows
        result = subprocess.run(command, shell=True, capture_output=True, cwd=cwd, check=False)
        stdout = result.stdout.decode('utf-8', errors='replace')
        stderr = result.stderr.decode('utf-8', errors='replace')
        return stdout, stderr, result.returncode
    except Exception as e:
        return "", str(e), 1

def scan_colors():
    print("--- 🎨 Design Compliance: Purple Ban Scan ---")
    stdout, stderr, code = run_command('git grep -niE "purple|indigo|violet" -- web/app web/components web/lib web/styles')
    if stdout:
        violations = []
        for line in stdout.strip().split('\n'):
            # Filter out test files and auto-generated stuff if needed
            if "__tests__" not in line and "node_modules" not in line:
                violations.append(line)
        
        if violations:
            print(f"❌ Found {len(violations)} violations!")
            for v in violations:
                print(f"  - {v}")
            return False
        else:
            print("✅ 0 production violations found (excluding tests).")
            return True
    print("✅ No violations found.")
    return True

def check_security_headers():
    print("\n--- 🔒 Security: next.config.ts Check ---")
    config_path = os.path.join("web", "next.config.ts")
    if not os.path.exists(config_path):
        print("❌ web/next.config.ts not found!")
        return False
    
    with open(config_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    headers = ["Content-Security-Policy", "Strict-Transport-Security", "X-Frame-Options"]
    missing = [h for h in headers if h not in content]
    
    if missing:
        print(f"❌ Missing headers: {', '.join(missing)}")
        return False
    print("✅ All critical security headers present.")
    return True

def run_tests():
    print("\n--- 🧪 Testing: Automated Suite ---")
    stdout, stderr, code = run_command("npm run test", cwd="web")
    if code != 0:
        print("❌ Automated tests failed!")
        print(stderr)
        return False
    print("✅ Automated tests passed.")
    return True

def main():
    print("🚀 BH-EDU SYSTEM AUDIT V1.0")
    print("============================")
    
    results = [
        scan_colors(),
        check_security_headers(),
        run_tests()
    ]
    
    print("\n============================")
    if all(results):
        print("🎉 AUDIT PASSED! Codebase is compliant and secure.")
        sys.exit(0)
    else:
        print("⚠️ AUDIT FAILED! Please fix the issues above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
