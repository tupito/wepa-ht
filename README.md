# Ajo-ohje


```
# luo mariadb + adminer -Docker container, Docker pitää olla asennettuna (esim. Windows: Docker desktop), adminer-hallinta: localhost:8090
docker-compose up -d

# listaa käynnissä olevat kontit
docker ps (sama kuin docker container ls)

# sammuta docker containerit
docker stop wepa-ht_adminer_1
docker stop wepa-ht_db_1

# noden käynnistys
npm install
npm run start
npm run start-dev

# todo: testit
...

```

# Dev: Git-Cheatsheet

```
git status

# synkkaa remote lokaaliin
git fetch
git pull

# vain yhteissessiossa, lokaali remoteen (githubiin)
git push

git commit -m “add /app.js, add GET /”
* <add/edit/rm>, <add/fix/refactor> <feature>

# pieni muutos edelliseen committiin
    git add .
    git commit --amend --no-edit

# resetoi lähtötilanteeseen
git reset --hard HEAD

# suositus: tee uudelle ominaisuudelle aina oma branch ja lopuksi liitä se lokaaliin master-haaraan (branchiin)

    # luo uusi branch
    git branch new-feature
    # siirry uuteen branchiin
    git checkout new-feature

    # tee koodimuutokset ja commitoidaan...

    # siirry master branchiin
    git checkout master
    # mergeä muutokset new-feature-branchista
    git merge new-feature

    # listaa branchit
    git branch
    # poista new-feature branch
    git branch -D new-feature

git log --oneline -n5
```
# Github-prosessi karkeasti
```
Uudet ominaisuudet tehdään lokaalisti uuteen branchiin.
Ennen branchin mergeämistä lokaaliin masteriin,
ladataan viimeisin versio remote masterista (git fetch; git pull).
Ratkaistaan mahdolliset konfliktit lokaalisti git merge:n jälkeen.
Lopuksi uusi commit ja push remote masteriin.
```

# dev - npm packages

```
npm install nodemon --save-dev
npm install express
npm install sequelize
npm install mariadb
```

# dev - ESLint

```
npm install eslint
.\node_modules\.bin\eslint --init
```

# dev - vscode nodejs debugger

```
node --inspect .\app.js
```