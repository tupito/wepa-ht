# Ajo-ohje


```
# luo mariadb + adminer -Docker container, Docker pitää olla asennettuna (esim. Windows: Docker desktop)
docker-compose up -d

# todo: noden käynnistys
...

# todo: testit
...

```

# Dev: Git-Cheatsheet

```
git status

# synkkaa remote lokaaliin
git fetch

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