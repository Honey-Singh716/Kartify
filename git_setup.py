import subprocess
import os

project_path = r"c:\Users\ACER\Desktop\KARTIFY(1)"
log_path = os.path.join(project_path, "git_log.txt")

with open(log_path, "w") as f:
    f.write("Git Setup Script Started\n")
    def run(cmd):
        f.write(f"\nRunning: {' '.join(cmd)}\n")
        try:
            res = subprocess.run(cmd, cwd=project_path, capture_output=True, text=True)
            f.write(f"STDOUT: {res.stdout}\n")
            f.write(f"STDERR: {res.stderr}\n")
            return res
        except Exception as e:
            f.write(f"Exception while running {cmd}: {str(e)}\n")
            return None

    run(["git", "init"])
    run(["git", "remote", "remove", "origin"])
    run(["git", "remote", "add", "origin", "https://github.com/Honey-Singh716/Kartify.git"])
    run(["git", "branch", "-M", "main"])
    run(["git", "add", "."])
    run(["git", "commit", "-m", "Initial commit"])
    f.write("\nGit Setup Script Finished\n")
