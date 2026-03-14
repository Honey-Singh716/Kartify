@echo off
git remote remove origin
git remote add origin https://github.com/Honey-Singh716/Kartify.git
git branch -M main
git add .
git commit -m "Initial commit"
git push -u origin main
