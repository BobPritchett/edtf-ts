# Tested language examples

Generated from `packages/natural/tests/fixtures/languages.json` by `node packages/natural/scripts/generate-examples.cjs`. The English suite uses `en-GB`; Spanish uses `es-ES`; French uses `fr-FR`. Age examples use June 1, 2025. Alternative outputs are listed in confidence order.

| Feature | English | Español | Français | EDTF |
|---|---|---|---|---|
| date.year | 1870 | 1870 | 1870 | `1870` |
| date.full | March 12, 1870 | 12 de marzo de 1870 | 12 mars 1870 | `1870-03-12` |
| date.month | March 1870 | marzo 1870 | mars 1870 | `1870-03` |
| date.abbreviation | Sept. 1870 | sept. 1870 | sept. 1870 | `1870-09` |
| date.ordinal | 1ST March 1870 | 1º marzo 1870 | 1er mars 1870 | `1870-03-01` |
| qualifier.approximate | circa 1870 | hacia 1870 | vers 1870 | `1870~` |
| qualifier.uncertain | possibly 1870 | quizás 1870 | peut-être 1870 | `1870?` |
| qualifier.both | possibly circa 1870 | quizás hacia 1870 | peut-être vers 1870 | `1870%` |
| qualifier.component | 1870 (year uncertain) | 1870 (año incierto) | 1870 (année incertaine) | `?1870` |
| boundary.before | before 1870 | antes de 1870 | avant 1870 | `[..1869]` |
| boundary.after | after 1870 | después de 1870 | après 1870 | `[1871..]` |
| boundary.inclusiveBefore | no later than 1870 | no más tarde de 1870 | pas après 1870 | `[..1870]` |
| boundary.inclusiveAfter | no earlier than 1870 | no antes de 1870 | pas avant 1870 | `[1870..]` |
| boundary.by | by 1870 | a más tardar en 1870 | au plus tard en 1870 | `[..1870]` |
| boundary.suffixBefore | 1870 or earlier | 1870 o antes | 1870 ou avant | `[..1870]` |
| boundary.suffixAfter | 1870 or later | 1870 o después | 1870 ou après | `[1870..]` |
| boundary.pre | pre-1870 | pre-1870 | pré-1870 | `[..1869]` |
| boundary.post | post-1870 | post-1870 | post-1870 | `[1871..]` |
| boundary.month | before March 2024 | antes de marzo 2024 | avant mars 2024 | `[..2024-02]` |
| boundary.leapDay | before March 1, 2024 | antes de 1 de marzo de 2024 | avant 1 mars 2024 | `[..2024-02-29]` |
| interval.since | since 1870 | desde 1870 | depuis 1870 | `1870/..` |
| interval.explicit | from 1870 to 1880 | desde 1870 a 1880 | depuis 1870 à 1880 | `1870/1880` |
| interval.unknown | 1870 to unknown | 1870 a desconocido | 1870 à inconnu | `1870/` |
| interval.between | between 1870 and 1880 | entre 1870 y 1880 | entre 1870 et 1880 | `1870/1880` |
| interval.sharedDays | 1–3 March 2024 | 1–3 marzo 2024 | 1–3 mars 2024 | `2024-03-01/2024-03-03` |
| interval.sharedMonths | March–April 2024 | marzo–abril 2024 | mars–avril 2024 | `2024-03/2024-04` |
| interval.crossYear | December–January 2024 | diciembre–enero 2024 | décembre–janvier 2024 | `2023-12/2024-01`; `2024-12/2025-01` |
| set.finiteRange | sometime between 1870 and 1880 | algún momento entre 1870 y 1880 | à un moment entre 1870 et 1880 | `[1870..1880]` |
| set.sequence | 1870, 1880, 1890, 1900 or 1910 | 1870, 1880, 1890, 1900 o 1910 | 1870, 1880, 1890, 1900 ou 1910 | `[1870,1880,1890,1900,1910]` |
| list.sequence | 1870, 1880, 1890, 1900 and 1910 | 1870, 1880, 1890, 1900 y 1910 | 1870, 1880, 1890, 1900 et 1910 | `{1870,1880,1890,1900,1910}` |
| list.earlier | 1870 and earlier | 1870 y antes | 1870 et avant | `{..1870}` |
| period.century | nineteenth century | siglo XIX | XIXe siècle | `1801/1900` |
| period.decade | the 1980s | los años 1980 | les années 1980 | `198X` |
| period.earlyYear | early 1870 | a principios de 1870 | au début de 1870 | `1870-01/1870-04` |
| period.midMonth | mid March 1870 | a mediados de marzo 1870 | au milieu de mars 1870 | `1870-03-11/1870-03-20` |
| period.lateDecade | late 1980s | a finales de los años 1980 | à la fin des années 1980 | `1987/1989` |
| season.spring | spring 1870 | primavera 1870 | printemps 1870 | `1870-21` |
| season.summer | summer 1870 | verano 1870 | été 1870 | `1870-22` |
| season.autumn | autumn 1870 | otoño 1870 | automne 1870 | `1870-23` |
| season.winter | winter 1870 | invierno 1870 | hiver 1870 | `1870-24` |
| season.north | spring 1870 (northern hemisphere) | primavera 1870 (hemisferio norte) | printemps 1870 (hémisphère nord) | `1870-25` |
| season.south | spring 1870 (southern hemisphere) | primavera 1870 (hemisferio sur) | printemps 1870 (hémisphère sud) | `1870-29` |
| period.quarter | first quarter 1870 | primer trimestre 1870 | premier trimestre 1870 | `1870-33` |
| period.quadrimester | second quadrimester 1870 | segundo cuatrimestre 1870 | deuxième quadrimestre 1870 | `1870-38` |
| period.semester | second semester 1870 | segundo semestre 1870 | deuxième semestre 1870 | `1870-41` |
| era.bce | 1 BCE | 1 a. e. c. | 1 aec | `0000` |
| era.ce | 79 CE | 79 e. c. | 79 ec | `0079` |
| numeric.qualified | circa 01/02/2020 | hacia 01/02/2020 | vers 01/02/2020 | `2020-02-01~`; `2020-01-02~` |
| unspecified.day | some day in March 1870 | algún día de marzo 1870 | un jour de mars 1870 | `1870-03-XX` |
| unspecified.month | some month in 1870 | algún mes de 1870 | un mois de 1870 | `1870-XX` |
| reject.calendar | February 30, 2024 | 30 de febrero de 2024 | 30 février 2024 | Rejected |
| reject.reversed | from 1880 to 1870 | desde 1880 a 1870 | depuis 1880 à 1870 | Rejected |
| reject.fuzzyCutoff | before circa 1870 | antes de hacia 1870 | avant vers 1870 | Rejected |
| age.exact | 20 years old | 20 años | 20 ans | `?2004-?06-?02/?2005-?06-?01` |
| age.range | 20 to 23 years old | 20 a 23 años | 20 à 23 ans | `?2001-?06-?02/?2005-?06-?01` |
| age.birthday | 20 years old, birthday March 15 | 20 años, cumpleaños 15 de marzo | 20 ans, anniversaire le 15 mars | `2005-03-15` |
| age.birthdayMonth | 20 years old, June birthday | 20 años, cumpleaños junio | 20 ans, anniversaire juin | `[2004-06-02..2004-06-30,2005-06-01]` |
| birthday.only | birthday March 15 | cumpleaños 15 de marzo | anniversaire le 15 mars | `XXXX-03-15` |
| birthday.numeric | birthday 15/03 | cumpleaños 15/03 | anniversaire 15/03 | `XXXX-03-15` |
| age.bornConstraint | born before 1870 | nacido antes de 1870 | né avant 1870 | `[..1869]` |
| age.months | 6 months | 6 meses | 6 mois | `?2024-?11-?02/?2024-?12-?01` |
| age.weeks | 2 weeks | 2 semanas | 2 semaines | `?2025-?05-?12/?2025-?05-?18` |
| age.days | 10 days | 10 días | 10 jours | `?2025-?05-?22/?2025-?05-?22` |
| age.rejectBirthday | 20 years old, birthday February 30 | 20 años, cumpleaños 30 de febrero | 20 ans, anniversaire 30 février | Rejected |
| period.earlyCentury | early 19th century | a principios del siglo XIX | au début du XIXe siècle | `1801/1833` |
| period.lateCentury | late 19th century | a finales del siglo XIX | à la fin du XIXe siècle | `1867/1900` |
| period.bceCentury | early 5th century BCE | a principios del siglo V aec | au début du Ve siècle aec | `-0499/-0467` |
| period.combinedMonth | early to mid March 2024 | principios a mediados de marzo 2024 | du début au milieu de mars 2024 | `2024-03-01/2024-03-20` |
| period.combinedYear | mid to late 1870 | mediados a finales de 1870 | du milieu à la fin de 1870 | `1870-05/1870-12` |
| period.combinedDecade | early to mid 1980s | principios a mediados de los años 1980 | du début au milieu des années 1980 | `1980/1986` |
| period.qualified | circa late 1870 | aproximadamente a finales de 1870 | approximativement à la fin de 1870 | `1870-09~/1870-12~` |
| period.range | early 1870 to late 1880 | desde principios de 1870 a finales de 1880 | du début de 1870 à la fin de 1880 | `1870-01/1880-12` |
| age.approximateBirthday | about 20 years old, birthday March 15 | aproximadamente 20 años, cumpleaños 15 de marzo | environ 20 ans, anniversaire le 15 mars | `~2005-03-15` |
| age.monthsBirthday | 6 months, December birthday | 6 meses, cumpleaños diciembre | 6 mois, anniversaire décembre | `2024-12-01` |
| age.rejectMonthsBirthday | 6 months, March birthday | 6 meses, cumpleaños marzo | 6 mois, anniversaire mars | Rejected |
| age.rejectUnboundedBirthday | senior, March birthday | persona mayor, cumpleaños marzo | personne âgée, anniversaire mars | Rejected |
| set.rendered | One of: 1667, 1668, 1670 | Una de estas fechas: 1667, 1668 o 1670 | Une de ces dates: 1667, 1668 ou 1670 | `[1667..1668,1670]` |
| list.rendered | All of: 1667, 1668, 1670 | Todas estas fechas: 1667, 1668 y 1670 | Toutes ces dates: 1667, 1668 et 1670 | `{1667..1668,1670}` |
| set.renderedOpen | Earlier or one of: 1667, 1668, 1670, or later | Una de estas fechas: 1667 o antes, 1668 o 1670 o después | Une de ces dates: 1667 ou avant, 1668 ou 1670 ou après | `[..1667..1668,1670..]` |
| list.renderedOpen | Earlier and all of: 1667, 1668, 1670, and later | Todas estas fechas: 1667 y antes, 1668 y 1670 y después | Toutes ces dates: 1667 et avant, 1668 et 1670 et après | `{..1667..1668,1670..}` |
| set.rejectConjunction | One of: 1667 and 1668 | Una de estas fechas: 1667 y 1668 | Une de ces dates: 1667 et 1668 | Rejected |
| list.rejectDisjunction | All of: 1667 or 1668 | Todas estas fechas: 1667 o 1668 | Toutes ces dates: 1667 ou 1668 | Rejected |
| set.renderedRange | One of: 1870 through 1880 | Una de estas fechas: 1870 a 1880 | Une de ces dates: 1870 à 1880 | `[1870..1880]` |
| list.renderedRange | All of: 1870 through 1880 | Todas estas fechas: 1870 a 1880 | Toutes ces dates: 1870 à 1880 | `{1870..1880}` |
| set.renderedOpenRange | Earlier or one of: 1870 through 1880, 1890, or later | Antes o Una de estas fechas: 1870 a 1880 o 1890 o después | Plus tôt ou Une de ces dates: 1870 à 1880 ou 1890 ou après | `[..1870..1880,1890..]` |
| list.renderedOpenRange | Earlier and all of: 1870 through 1880, 1890, and later | Antes y Todas estas fechas: 1870 a 1880 y 1890 y después | Plus tôt et Toutes ces dates: 1870 à 1880 et 1890 et après | `{..1870..1880,1890..}` |
| interval.renderedOpenEnd | 1870 to open end | 1870 a fin abierto | 1870 à fin ouverte | `1870/..` |
| interval.renderedOpenStart | open start to 1870 | inicio abierto a 1870 | début ouvert à 1870 | `../1870` |
| interval.renderedUnknownEnd | 1870 to unknown | 1870 a desconocido | 1870 à inconnu | `1870/` |
| interval.renderedUnknownStart | unknown to 1870 | desconocido a 1870 | inconnu à 1870 | `/1870` |
| date.knownDayUnknownMonth | 12th of unknown month, 1870 | día 12 de mes desconocido, 1870 | 12 d'un mois inconnu, 1870 | `1870-XX-12` |
| date.knownDayUnknownMonthEra | 12th of unknown month, 1 BC | día 12 de mes desconocido, 1 a. C. | 12 d'un mois inconnu, 1 av. J.-C. | `0000-XX-12` |
| date.unknownYearDay | January 12, unknown year | 12 enero año desconocido | 12 janvier année inconnue | `XXXX-01-12` |
| date.unknownYearMonth | January, unknown year | enero año desconocido | janvier année inconnue | `XXXX-01` |
| date.monthOnly | January | enero | janvier | `XXXX-01` |
| date.unadornedMonth | month in 1872 | mes en 1872 | mois en 1872 | `1872-XX` |
| date.unadornedDay | day in January 1872 | día en enero 1872 | jour en janvier 1872 | `1872-01-XX` |
| date.unadornedDayMonth | day in 1872 | día en 1872 | jour en 1872 | `1872-XX-XX` |
| interval.monthSeason | march 1988 - spring 1990 | marzo 1988 - primavera 1990 | mars 1988 - printemps 1990 | `1988-03/1990-21` |
| interval.seasonMonth | spring 1988 - march 1990 | primavera 1988 - marzo 1990 | printemps 1988 - mars 1990 | `1988-21/1990-03` |
| interval.monthQualifiedSeason | march 1988 - winter 2005? | marzo 1988 - invierno 2005? | mars 1988 - hiver 2005? | `1988-03/2005-24?` |
| interval.fromMonths | from January 1999 to December 1999 | de enero 1999 a diciembre 1999 | De Janvier 1999 à Décembre 1999 | `1999-01/1999-12` |
| interval.fromApproximateYears | from 1970 about to 1980 about | de 1970 aproximadamente a 1980 aproximadamente | De 1970 environ à 1980 environ | `1970~/1980~` |
| interval.shortEndYear | 1851-52 | 1851-52 | 1851-52 | `1851/1852` |
| interval.dashUnknown | 1988 - unknown | 1988 - desconocido | 1988 - inconnu | `1988/` |
| interval.dashOpen | 1988 - open | 1988 - abierto | 1988 - en cours | `1988/..` |
| list.semicolon | 2020; 2021 | 2020; 2021 | 2020; 2021 | `{2020..2021}` |
| period.qualifiedCentury | 19th century? | siglo 19? | 19e siècle? | `1801?/1900?` |
| period.romanCentury | XIXth century | siglo XIX | XIXè siècle | `1801/1900` |
| season.era | Spring 4BCE | primavera 4 a. C. | printemps 4AEC | `-0003-21` |
| season.qualifiedSuffix | about winter 1988? | aproximadamente invierno 1988? | environ l'hiver 1988? | `1988-24%` |
| date.article | the 03/29/1988 | el 29/03/1988 | le 29/03/1988 | `1988-03-29` |
| date.validWeekday | Tuesday, March 29, 1988 | martes, 29 marzo 1988 | mardi, 29 mars 1988 | `1988-03-29` |
| date.invalidWeekday | Monday, March 29, 1988 | lunes, 29 marzo 1988 | lundi, 29 mars 1988 | Rejected |
