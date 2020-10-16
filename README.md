# Ajo-ohje

```
1. Asenna docker ja docker-compose, esim. Windows: Docker desktop (https://www.docker.com/products/docker-desktop)

2. luo tietokanta (mariadb + adminer)
docker-compose up -d 

3. asenna sovellus
npm install

4a. Vaihtoehto #1: aja testit (ensimmäinen testi lisää db:n rakenteen ja lisää mallidatan)
npm test

4b. Vaihtoehto #2: käynnistä sovellus ja tee api-pyynnöt esim. Postmanilla
npm run start
* Kutsu ensin GET localhost:8000/initdb, muuten teet pyyntöjä tyhjää tietokantaa vasten eikä mikään voi toimia.
* huom. POST /login (username:bob password: blackLodge), body pitää lähettää x-www-form-urlencoded-muodossa. 
** onnistunut login palauttaa tokenin, jota käytetään muiden kutsujen Headerissa muodossa Authorization: "Bearer xxxxxx"

Tietokantaa voi tarkastella selainpohjaisen adminerin kautta: localhost:8090
user: root
pwd: root
```

# Ajo-ohje prosessi

![Process image](https://raw.githubusercontent.com/tupito/wepa-ht/master/how-to-run-process.png)

# Github-prosessi karkeasti
```
Uudet ominaisuudet tehdään lokaalisti uuteen branchiin.
Ennen branchin mergeämistä lokaaliin masteriin,
ladataan viimeisin versio remote masterista (git fetch; git pull).
Ratkaistaan mahdolliset konfliktit lokaalisti git merge:n jälkeen.
Lopuksi uusi commit ja push remote masteriin.
```

![Process image](https://raw.githubusercontent.com/tupito/wepa-ht/master/git-process.png)


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

# dev - ESLint init

```
.\node_modules\.bin\eslint --init
```