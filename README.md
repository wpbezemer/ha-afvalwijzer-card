# Afvalwijzer Card

Een mooie Lovelace custom card voor Home Assistant die ophaaldata van afvalfracties toont met urgentie-indicatoren.

Werkt samen met de [Afvalwijzer](https://github.com/xirixiz/homeassistant-afvalwijzer) integratie van [@xirixiz](https://github.com/xirixiz). Getest en ontwikkeld op basis van deze integratie.

> ✅ Getest met [homeassistant-afvalwijzer](https://github.com/xirixiz/homeassistant-afvalwijzer)

![Afvalwijzer Card preview](https://raw.githubusercontent.com/YOUR_USERNAME/afvalwijzer-card/main/preview.png)

## Functies

- Toont ophaaldata voor Restafval, GFT, Papier en Plastic/PMD
- Automatische urgentie-kleuren (Vandaag / Morgen / Deze week / Volgende week)
- Sorteert automatisch op dichtstbijzijnde ophaaldag
- Groepeert per sectie op basis van kalenderweek
- Keuze tussen week start op Maandag of Zondag
- Visuele editor in de Lovelace UI
- Al-typend filteren bij toevoegen van entiteiten
- Werkt met de `days_until_collection_date` attribuut

## Vereisten

Deze card is getest met de [homeassistant-afvalwijzer](https://github.com/xirixiz/homeassistant-afvalwijzer) integratie van [@xirixiz](https://github.com/xirixiz). De sensoren van deze integratie leveren o.a. het `days_until_collection_date` attribuut waar de card gebruik van maakt.

Installeer eerst de Afvalwijzer integratie via HACS voordat je deze card gebruikt.

## Installatie via HACS

1. Ga naar HACS → Frontend
2. Klik op de drie puntjes rechtsboven → **Custom repositories**
3. Voeg toe: `https://github.com/YOUR_USERNAME/afvalwijzer-card` als type **Dashboard**
4. Zoek naar **Afvalwijzer Card** en installeer
5. Herstart Home Assistant of ververs de browser

## Handmatige installatie

1. Download `afvalwijzer-card.js`
2. Zet het bestand in `/config/www/afvalwijzer-card.js`
3. Ga naar **Instellingen → Dashboards → Resources**
4. Voeg toe: `/local/afvalwijzer-card.js` als type **JavaScript module**
5. Herstart of ververs de browser

## Configuratie

### Via de visuele editor

Voeg een nieuwe kaart toe en zoek op **Afvalwijzer Card**. Je kunt entiteiten toevoegen door te typen — de editor filtert automatisch op beschikbare entiteiten.

### Via YAML

```yaml
type: custom:afvalwijzer-card
title: Afvalkalender
week_starts_on: monday   # of sunday
entities:
  - sensor.afvalwijzer_restafval
  - sensor.afvalwijzer_gft
  - sensor.afvalwijzer_papier
  - sensor.afvalwijzer_pmd
```

### Opties

| Optie | Type | Standaard | Omschrijving |
|-------|------|-----------|--------------|
| `title` | string | `Afvalkalender` | Titel van de kaart |
| `entities` | list | verplicht | Lijst van sensor entiteiten |
| `week_starts_on` | `monday` \| `sunday` | `monday` | Eerste dag van de week |

## Urgentie-niveaus

| Label | Wanneer | Kleur |
|-------|---------|-------|
| **Vandaag!** | Ophaaldag is vandaag | Rood |
| **Morgen!** | Ophaaldag is morgen | Oranje |
| **X dagen** | Binnen de huidige kalenderweek | Amber |
| **X dagen** | Volgende kalenderweek | Grijs |
| **X dagen** | Later | Gedimpt grijs |

## Ondersteunde fracties

De kaart herkent automatisch de fractie op basis van de `friendly_name` van de entiteit en toont het bijbehorende icoon en kleur:

| Fractie | Herkend op | Kleur |
|---------|-----------|-------|
| Plastic / PMD | `plastic`, `pmd` | Oranje |
| GFT / Bio | `gft`, `bio`, `groen` | Groen |
| Papier | `papier`, `blauw`, `karton` | Blauw |
| Restafval | `rest`, `grijs` | Grijs |

## Licentie

MIT License
