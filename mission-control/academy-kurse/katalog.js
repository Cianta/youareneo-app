// Kurskatalog YOU ARE NEO Academy — 46 neue Kurse (34 bestehen, Ziel 80, 20 Plätze bleiben frei).
// Jeder Kurs: 3 Module, je eine erste Einheit. Videos und PDFs kommen später.
// preis = Einzelkauf in Euro (40–90 je nach Umfang).

const K = (slug, name, kat, preis, text, module) => ({ slug, name, kat, preis, text, module });
const M = (name, text, einheit, einheitText) => ({ name, text, einheit, einheitText });

module.exports = [
  // ── Bewegung & Energie ─────────────────────────────────────────
  K('yoga-grundlagen', 'Yoga Grundlagen – Atem, Haltung, Ruhe', 'Bewegung & Energie', 60,
    'Ein ruhiger Einstieg ins Yoga: stabile Haltungen, bewusster Atem und kleine Sequenzen, die in jeden Morgen passen. Ohne Leistungsdruck, ohne Verbiegen.', [
    M('Ankommen im Körper', 'Wie du stehst, sitzt und liegst, bevor irgendeine Übung beginnt.', 'Die Matte als Ort der Rückkehr', 'Warum zehn ehrliche Minuten mehr bringen als eine perfekte Stunde.'),
    M('Der Atem führt', 'Atem als Taktgeber für Bewegung und Stille.', 'Bauchatmung neu entdecken', 'Eine einfache Übung, die das Nervensystem spürbar beruhigt.'),
    M('Deine erste Sequenz', 'Zwölf Haltungen, die zusammen einen Morgenfluss ergeben.', 'Der Sonnengruß in Zeitlupe', 'Jede Bewegung einzeln, dann verbunden — in deinem Tempo.')]),
  K('atemarbeit', 'Atemarbeit – Die Kraft des Atems', 'Bewegung & Energie', 50,
    'Atemtechniken aus Qi-Gong, Yoga und moderner Atemforschung: zum Beruhigen, zum Wachwerden und zum Loslassen.', [
    M('Wie Atmen wirkt', 'Was im Körper passiert, wenn sich der Atem verändert.', 'Der Atem als Brücke', 'Zwischen bewusst und unbewusst — die einzige Körperfunktion, die beides kann.'),
    M('Beruhigende Techniken', 'Verlängertes Ausatmen, Box-Atmung, Qi-Atem.', 'Vier Takte zur Ruhe', 'Die Box-Atmung Schritt für Schritt.'),
    M('Aktivierende Techniken', 'Kraftvolle Atemzyklen — mit klaren Sicherheitsregeln.', 'Energie wecken, sicher bleiben', 'Wann aktivierende Atmung passt und wann nicht.')]),
  K('ruecken-befreien', 'Rücken befreien – Wirbelsäule in Bewegung', 'Bewegung & Energie', 60,
    'Sanfte Übungen aus Zhineng Qi-Gong und Faszienarbeit für einen beweglichen, aufgerichteten Rücken im Alltag.', [
    M('Die Wirbelsäule verstehen', 'Aufbau, Bewegungsrichtungen und warum sie Bewegung braucht.', 'Das Rückgrat als Lebensachse', 'Warum Aufrichtung mehr ist als gerade sitzen.'),
    M('Lösen und Mobilisieren', 'Wellenbewegungen, Drehungen, sanftes Dehnen.', 'Die Wirbelsäulenwelle', 'Eine Grundübung, Wirbel für Wirbel.'),
    M('Rücken im Alltag', 'Sitzen, Heben, Schlafen — kleine Veränderungen mit großer Wirkung.', 'Drei Minuten am Schreibtisch', 'Eine Pausenroutine, die niemand bemerkt.')]),
  K('holistic-pulsing', 'Holistic Pulsing – Heilsame Berührung', 'Bewegung & Energie', 80,
    'Rhythmische, sanfte Körperarbeit, die tiefe Entspannung ermöglicht. Grundlagen für die Anwendung in Familie und Freundeskreis.', [
    M('Das Prinzip des Wiegens', 'Rhythmus, Wasser im Körper und die Kunst des Nichttuns.', 'Was Pulsing ist — und was nicht', 'Herkunft, Haltung und klare Grenzen zur Medizin.'),
    M('Die Hände lernen', 'Kontakt, Druck, Rhythmus und Präsenz.', 'Der erste Kontakt', 'Wie Berührung beginnt, die sich sicher anfühlt.'),
    M('Eine Behandlung geben', 'Ablauf, Raum, Nachruhe und Rückmeldung.', 'Der Raum für die Behandlung', 'Vorbereitung, Einverständnis und Abschluss.')]),
  K('massage-energiepraxis', 'Massage & Energiepraxis', 'Bewegung & Energie', 80,
    'Klassische Griffe, Akupressurpunkte und energetisches Arbeiten — verbunden zu einer achtsamen Massage für den Hausgebrauch.', [
    M('Grundgriffe', 'Streichen, Kneten, Reiben — sauber ausgeführt.', 'Die fünf Grundgriffe', 'Welcher Griff was bewirkt, und in welcher Reihenfolge.'),
    M('Punkte und Bahnen', 'Ausgewählte Akupressurpunkte aus der chinesischen Tradition.', 'Punkte finden mit dem Daumen', 'Eine Einführung ins Ertasten.'),
    M('Die ganze Behandlung', 'Vom Nacken bis zu den Füßen in dreißig Minuten.', 'Nacken und Schultern lösen', 'Die Region, in der fast jeder Spannung trägt.')]),
  K('meditation-lernen', 'Meditation lernen – Der Weg nach innen', 'Bewegung & Energie', 50,
    'Schritt für Schritt meditieren lernen: sitzen, wahrnehmen, loslassen. Die Grundlage für alle Meditationen der Academy.', [
    M('Sitzen', 'Eine Haltung finden, die trägt.', 'Wie man sitzt, ohne zu leiden', 'Kissen, Stuhl oder Boden — alles ist erlaubt.'),
    M('Wahrnehmen', 'Atem, Körper, Geräusche, Gedanken.', 'Der Anker', 'Warum der Geist wandert und wie du freundlich zurückkehrst.'),
    M('Im Alltag bleiben', 'Meditation, die nicht auf dem Kissen endet.', 'Eine Minute Präsenz', 'Die kleinste Übung, die trotzdem wirkt.')]),

  // ── Kampfkunst ─────────────────────────────────────────────────
  K('kung-fu', 'Kung Fu Grundlagen', 'Kampfkunst', 70,
    'Stände, Schritte und Grundtechniken des traditionellen Kung Fu — als Weg zu Kraft, Haltung und innerer Ruhe.', [
    M('Die Stände', 'Pferdestand, Bogenstand, Katzenstand.', 'Der Pferdestand', 'Die Mutter aller Stände und warum man ihn hält.'),
    M('Hände und Füße', 'Fauststöße, Blöcke, Tritte in sauberer Form.', 'Die gerade Faust', 'Kraft aus dem Boden, nicht aus dem Arm.'),
    M('Die erste Form', 'Bewegungen verbinden sich zu einer Abfolge.', 'Die Form als Meditation', 'Wiederholung als Weg zur Meisterschaft.')]),
  K('batto-jutsu', 'Enshin Itto Ryu Batto Jutsu – Der Weg des Schwertes', 'Kampfkunst', 90,
    'Die Kunst des Schwertziehens: Etikette, Haltung und die ersten Formen. Ein Weg zu Konzentration und Klarheit.', [
    M('Reigi – die Etikette', 'Respekt vor Schwert, Raum und Gegenüber.', 'Warum man sich verneigt', 'Die Haltung hinter dem Ritual.'),
    M('Das Schwert kennen', 'Aufbau, Handhabung, Sicherheit.', 'Das Bokken als Lehrer', 'Mit dem Holzschwert beginnen.'),
    M('Die ersten Kata', 'Ziehen, Schneiden, Reinigen, Zurückführen.', 'Nukitsuke – der erste Schnitt', 'Die Bewegung, aus der alles entsteht.')]),
  K('selbstverteidigung', 'Selbstverteidigung im Alltag', 'Kampfkunst', 60,
    'Grenzen erkennen, Konflikte entschärfen, sich im Ernstfall befreien. Für alle, unabhängig von Alter und Kraft.', [
    M('Bevor es passiert', 'Wahrnehmung, Körpersprache, Abstand.', 'Die beste Verteidigung', 'Warum die meisten Konflikte ohne Berührung enden.'),
    M('Die Stimme und die Grenze', 'Klar sprechen, laut werden, Hilfe holen.', 'Nein sagen mit dem ganzen Körper', 'Eine Übung für Stimme und Stand.'),
    M('Befreiungen', 'Einfache Techniken gegen Griffe.', 'Aus dem Handgelenkgriff', 'Eine Befreiung, die ohne Kraft funktioniert.')]),
  K('ninjutsu-vertiefung', 'Ninjutsu – Taijutsu und die Kunst der Anpassung', 'Kampfkunst', 80,
    'Aufbauend auf „Die Kunst des Kämpfens": fließende Körperbewegung, Distanz und Timing im Bujinkan Ninjutsu.', [
    M('Taijutsu', 'Der Körper als Ganzes bewegt sich.', 'Bewegung aus dem Zentrum', 'Warum Ninjutsu weich aussieht und doch wirkt.'),
    M('Distanz und Timing', 'Ma-ai — der richtige Abstand zur richtigen Zeit.', 'Der Raum zwischen zwei Menschen', 'Distanz spüren statt messen.'),
    M('Anpassung', 'Nicht gegen die Kraft, sondern mit ihr.', 'Wie Wasser werden', 'Das Prinzip der Anpassung im Training und im Leben.')]),

  // ── Schamanismus & Bewusstsein ─────────────────────────────────
  K('schamanische-reise', 'Schamanische Reise & Krafttiere', 'Schamanismus & Bewusstsein', 70,
    'Die Grundlagen der schamanischen Reise: Rhythmus, Absicht, Rückkehr — und die Begegnung mit dem eigenen Krafttier.', [
    M('Die drei Welten', 'Untere, mittlere und obere Welt im schamanischen Weltbild.', 'Eine Landkarte der Seele', 'Wie verschiedene Kulturen die Welten beschreiben.'),
    M('Die Reise', 'Trommel, Absicht und sichere Rückkehr.', 'Die erste Reise vorbereiten', 'Raum, Frage und Schutz.'),
    M('Krafttiere', 'Begegnung, Beziehung, Botschaft.', 'Wenn ein Tier dich findet', 'Wie man einer Begegnung begegnet, ohne sie zu deuten.')]),
  K('rituale-jahreskreis', 'Rituale im Jahreskreis', 'Schamanismus & Bewusstsein', 50,
    'Sonnwenden, Tagundnachtgleichen und Mondzeiten als Anker im Jahr — mit einfachen Ritualen für dich und deine Gemeinschaft.', [
    M('Warum Rituale', 'Übergänge bewusst gestalten.', 'Das Ritual als Pause', 'Was Menschen seit Jahrtausenden tun, und warum.'),
    M('Die acht Feste', 'Vom Wintersonnwend bis Samhain.', 'Wintersonnwende – die Rückkehr des Lichts', 'Ein Ritual für die längste Nacht.'),
    M('Eigene Rituale', 'Einfach, ehrlich, wiederholbar.', 'Ein Ritual für deinen Morgen', 'Drei Elemente, die jedes Ritual trägt.')]),
  K('traumarbeit', 'Traumarbeit & Klarträumen', 'Schamanismus & Bewusstsein', 60,
    'Träume erinnern, verstehen und bewusst im Traum erwachen. Ein alter Weg zur Selbsterkenntnis.', [
    M('Träume erinnern', 'Das Traumtagebuch und der Moment des Aufwachens.', 'Das Traumtagebuch', 'Wie aus Fetzen Geschichten werden.'),
    M('Träume verstehen', 'Symbole, Gefühle und persönliche Bedeutung.', 'Dein Traum gehört dir', 'Warum Traumlexika selten helfen.'),
    M('Klarträumen', 'Realitätschecks und das Erwachen im Traum.', 'Der erste Realitätscheck', 'Eine Gewohnheit am Tag, die nachts wirkt.')]),
  K('frequenz-labor', 'Frequenz Labor – Klang, Schwingung, Resonanz', 'Schamanismus & Bewusstsein', 70,
    'Wie Klang auf Körper und Geist wirkt: Obertöne, Klangschalen, Solfeggio und eigene Experimente — neugierig und nüchtern zugleich.', [
    M('Was Schwingung ist', 'Physik von Klang und Resonanz, einfach erklärt.', 'Alles schwingt', 'Vom Stimmgabelversuch zur Frage nach Wirkung.'),
    M('Instrumente', 'Klangschalen, Monochord, Stimme, Trommel.', 'Die Klangschale anschlagen', 'Wie ein Ton entsteht und vergeht.'),
    M('Eigene Experimente', 'Beobachten, aufschreiben, vergleichen.', 'Ein Klangtagebuch führen', 'Wirkung prüfen, statt nur zu glauben.')]),
  K('moderne-techniken', 'Moderne Bewusstseinstechniken', 'Schamanismus & Bewusstsein', 60,
    'Biofeedback, Herzkohärenz, Binaurale Beats und Neurowissen — was moderne Werkzeuge über alte Praktiken verraten.', [
    M('Herz und Hirn', 'Herzratenvariabilität und Kohärenz.', 'Was dein Herzschlag verrät', 'HRV einfach erklärt.'),
    M('Werkzeuge', 'Apps, Sensoren, Klänge — und ihre Grenzen.', 'Biofeedback für Einsteiger', 'Sehen, was sonst verborgen bleibt.'),
    M('Alt trifft neu', 'Meditation, Qi-Gong und Messbarkeit.', 'Brücken zwischen den Welten', 'Was Forschung bestätigt und was offen bleibt.')]),
  K('intuition', 'Intuition & innere Stimme', 'Schamanismus & Bewusstsein', 50,
    'Die innere Stimme von Angst und Wunsch unterscheiden lernen — mit Übungen für Körper, Gefühl und Entscheidung.', [
    M('Was Intuition ist', 'Schnelles Wissen aus Erfahrung und Gespür.', 'Das Bauchgefühl ernst nehmen', 'Und wann man es prüfen sollte.'),
    M('Unterscheiden lernen', 'Intuition, Angst und Wunschdenken.', 'Drei Stimmen im Kopf', 'Eine Übung zum Auseinanderhalten.'),
    M('Entscheiden', 'Intuition im Alltag anwenden.', 'Die Münzwurf-Übung', 'Warum das Gefühl beim Ergebnis mehr sagt als die Münze.')]),

  // ── Heilwissen & Natur ─────────────────────────────────────────
  K('permakultur', 'Permakultur & Gemüsegarten', 'Heilwissen & Natur', 80,
    'Gärten, die mit der Natur arbeiten statt gegen sie: Boden, Mischkultur, Wasser und Kreisläufe — vom Balkon bis zum Hof.', [
    M('Die Prinzipien', 'Beobachten, Kreisläufe schließen, Vielfalt nutzen.', 'Erst beobachten, dann handeln', 'Ein Jahr lang hinsehen, bevor man gräbt.'),
    M('Lebendiger Boden', 'Kompost, Mulch und Bodenleben.', 'Kompost richtig ansetzen', 'Die Grundlage jedes gesunden Gartens.'),
    M('Mischkultur', 'Pflanzen, die sich gegenseitig helfen.', 'Die drei Schwestern', 'Mais, Bohne, Kürbis — ein altes Beispiel.')]),
  K('selbstversorgung', 'Selbstversorgung – Haltbar machen, Fermentieren, Vorrat', 'Heilwissen & Natur', 60,
    'Einkochen, Fermentieren, Trocknen und Lagern: alte Techniken für eine unabhängige, gesunde Vorratskammer.', [
    M('Fermentieren', 'Sauerkraut, Kimchi, Kombucha.', 'Sauerkraut im Glas', 'Zwei Zutaten, ein lebendiges Lebensmittel.'),
    M('Einkochen und Trocknen', 'Sicher konservieren ohne Zusatzstoffe.', 'Einkochen ohne Risiko', 'Sauberkeit, Temperatur, Zeit.'),
    M('Die Vorratskammer', 'Planen, lagern, rotieren.', 'Ein Vorrat, der lebt', 'Was man hat, wird auch gegessen.')]),
  K('waldwissen', 'Waldwissen – Bäume, Böden, Wildnis', 'Heilwissen & Natur', 50,
    'Den Wald lesen lernen: Baumarten, Pilznetzwerke, Spuren und die Stille zwischen den Stämmen.', [
    M('Bäume erkennen', 'Rinde, Blatt, Wuchs und Standort.', 'Zehn Bäume, die jeder kennen sollte', 'Mit allen Sinnen bestimmen.'),
    M('Das unsichtbare Netz', 'Wurzeln, Pilze und Austausch unter der Erde.', 'Wie Bäume sich verbinden', 'Das Mykorrhiza-Netz einfach erklärt.'),
    M('Im Wald sein', 'Waldbaden, Orientierung, Respekt.', 'Eine Stunde ohne Ziel', 'Waldbaden als Übung der Aufmerksamkeit.')]),
  K('hausapotheke', 'Naturheilkunde für die Hausapotheke', 'Heilwissen & Natur', 60,
    'Tees, Wickel, Auflagen und Salben für kleine Alltagsbeschwerden — mit klarer Grenze, wann ärztliche Hilfe nötig ist.', [
    M('Grundausstattung', 'Was in eine natürliche Hausapotheke gehört.', 'Die zwölf Helfer', 'Pflanzen und Mittel, die sich bewährt haben.'),
    M('Anwendungen', 'Tee, Wickel, Auflage, Dampfbad.', 'Der Zwiebelwickel', 'Ein Hausmittel, Schritt für Schritt.'),
    M('Grenzen kennen', 'Wann Naturheilkunde reicht und wann nicht.', 'Warnzeichen erkennen', 'Wann du ärztliche Hilfe brauchst — ohne Umwege.')]),
  K('wasser', 'Wasser – Quelle des Lebens', 'Heilwissen & Natur', 40,
    'Woher unser Wasser kommt, was es trägt und wie wir es schützen: Quellen, Filter, Kreisläufe und die Kultur des Wassers.', [
    M('Der Kreislauf', 'Vom Regen zur Quelle zum Meer.', 'Die Reise eines Tropfens', 'Den großen Kreislauf verstehen.'),
    M('Trinkwasser', 'Qualität, Filterung, Speicherung.', 'Was in deinem Wasser ist', 'Befunde lesen und einordnen.'),
    M('Wasser schützen', 'Im Haushalt, im Garten, in der Gemeinde.', 'Regenwasser nutzen', 'Einfache Systeme für Garten und Haus.')]),
  K('heilfasten', 'Fasten – Grundlagen und Grenzen', 'Heilwissen & Natur', 50,
    'Intervallfasten, Fastenwochen und bewusster Verzicht — mit Vorbereitung, Begleitung und klaren Ausschlusskriterien.', [
    M('Warum Fasten', 'Tradition, Körper und Geist.', 'Fasten in den Kulturen der Welt', 'Ein Blick in Religion und Heilkunde.'),
    M('Formen des Fastens', 'Intervall, Saft, Wasser — Unterschiede und Risiken.', 'Welche Form zu wem passt', 'Und wer nicht fasten sollte.'),
    M('Die Fastenwoche', 'Entlastung, Fasten, Aufbau.', 'Die Aufbautage', 'Der wichtigste und meist vergessene Teil.')]),
  K('bienen', 'Bienen & Bestäuber schützen', 'Heilwissen & Natur', 40,
    'Wildbienen, Honigbienen und Schmetterlinge verstehen — und Gärten, Balkone und Wiesen zu Lebensräumen machen.', [
    M('Die Bestäuber', 'Wer bestäubt eigentlich was?', 'Mehr als die Honigbiene', 'Über 500 Wildbienenarten allein im deutschsprachigen Raum.'),
    M('Lebensraum schaffen', 'Blühpflanzen, Nisthilfen, Wasserstellen.', 'Ein Bienenbalkon', 'Was schon auf zwei Quadratmetern hilft.'),
    M('Imkern mit Respekt', 'Wesensgemäße Bienenhaltung im Überblick.', 'Die Biene zuerst', 'Was wesensgemäße Haltung bedeutet.')]),
  K('natuerlich-bauen', 'Natürlich bauen – Lehm, Holz, Stroh', 'Heilwissen & Natur', 90,
    'Bauen mit Materialien, die atmen und zurück in den Kreislauf können. Grundlagen aus der Praxis von Gemeinschaftsprojekten wie Awen.', [
    M('Baustoffe der Erde', 'Lehm, Holz, Stroh, Stein, Kalk.', 'Lehm in der Hand', 'Die Probe, die jeder machen kann.'),
    M('Techniken', 'Lehmputz, Strohballen, Holzverbindungen.', 'Ein Lehmputz für die Wand', 'Mischen, auftragen, glätten.'),
    M('Gemeinsam bauen', 'Planung, Genehmigung, Mitmach-Baustellen.', 'Die Mitmach-Baustelle', 'Wie viele Hände ein Haus bauen.')]),

  // ── Kunst & Musik ──────────────────────────────────────────────
  K('ai-art', 'AI ART – Kunst mit künstlicher Intelligenz', 'Kunst & Musik', 60,
    'Bilder, Klänge und Geschichten gemeinsam mit KI erschaffen — mit eigener Handschrift und klarem Blick auf Urheberschaft und Verantwortung.', [
    M('Werkzeuge', 'Bild-, Video- und Musik-KI im Überblick.', 'Die erste Bildidee', 'Vom Satz zum Bild.'),
    M('Die eigene Handschrift', 'Stil, Auswahl und Nachbearbeitung.', 'Warum der Mensch entscheidet', 'Kuratieren als künstlerische Tat.'),
    M('Verantwortung', 'Urheberrecht, Kennzeichnung, Ehrlichkeit.', 'Kunst, die sich zu erkennen gibt', 'Wie man KI-Werke fair kennzeichnet.')]),
  K('nature-art', 'Nature ART – Kunst als Brücke zur Natur', 'Kunst & Musik', 50,
    'Land Art, Naturmaterialien und vergängliche Werke: Kunst, die draußen entsteht und die Natur ehrt.', [
    M('Sehen lernen', 'Formen, Farben und Muster in der Natur.', 'Ein Spaziergang mit Künstleraugen', 'Sammeln ohne zu schaden.'),
    M('Land Art', 'Kreise, Linien, Spiralen aus dem, was da ist.', 'Die erste Spirale', 'Ein Werk aus Blättern, das der Wind wieder nimmt.'),
    M('Vergänglichkeit', 'Fotografieren, loslassen, weitergeben.', 'Das Werk, das bleibt, ist das Foto', 'Natur dokumentieren.')]),
  K('musik-produzieren', 'Musik produzieren – Sounds, Beats, Videos', 'Kunst & Musik', 80,
    'Vom ersten Klang zum fertigen Stück und Musikvideo: Aufnahme, Arrangement, Mischung und Veröffentlichung.', [
    M('Das Studio zu Hause', 'Was man wirklich braucht.', 'Ein Studio für wenig Geld', 'Laptop, Kopfhörer, Mikrofon — und Ohren.'),
    M('Vom Klang zum Stück', 'Aufnehmen, arrangieren, mischen.', 'Der erste Loop', 'Aus acht Takten wird ein Anfang.'),
    M('Das Musikvideo', 'Bilder, Schnitt und Veröffentlichung.', 'Ein Video mit dem Smartphone', 'Licht, Bild und Rhythmus im Schnitt.')]),
  K('stimme-gesang', 'Stimme & Gesang befreien', 'Kunst & Musik', 60,
    'Die eigene Stimme finden und frei klingen lassen: Atem, Resonanz, Obertöne und gemeinsames Singen.', [
    M('Der Atem trägt', 'Stütze, Haltung und Entspannung.', 'Singen beginnt im Bauch', 'Eine Übung zur Atemstütze.'),
    M('Resonanz', 'Kopf, Brust, Maske — die Räume der Stimme.', 'Summen als Schlüssel', 'Die Resonanzräume spüren.'),
    M('Gemeinsam singen', 'Kreislieder, Mantren, Obertonsingen.', 'Ein Lied für den Kreis', 'Singen ohne Noten und ohne Angst.')]),
  K('intuitives-malen', 'Intuitives Malen & Gestalten', 'Kunst & Musik', 50,
    'Malen ohne Vorlage und ohne Bewertung: Farbe, Geste und Ausdruck als Weg zu dir selbst.', [
    M('Farbe und Gefühl', 'Warum Farben wirken.', 'Die Farbe des Tages', 'Eine Einstiegsübung für jeden Morgen.'),
    M('Die freie Geste', 'Große Formate, Pinsel, Hände.', 'Malen mit geschlossenen Augen', 'Loslassen, was richtig aussehen soll.'),
    M('Das Bild spricht', 'Betrachten statt beurteilen.', 'Einem Bild zuhören', 'Fragen an das eigene Werk.')]),
  K('film-smartphone', 'Filmen mit dem Smartphone – Geschichten erzählen', 'Kunst & Musik', 60,
    'So entstehen Beiträge für NEO TV: Idee, Bild, Ton, Schnitt und Veröffentlichung — alles mit dem Gerät in deiner Tasche.', [
    M('Die Geschichte', 'Idee, Aufbau, Kernaussage.', 'In einem Satz erzählt', 'Die Kernaussage vor dem Dreh.'),
    M('Bild und Ton', 'Licht, Einstellungen, Mikrofon.', 'Licht ist alles', 'Mit Fensterlicht professionell wirken.'),
    M('Schnitt', 'Rhythmus, Übergänge, Untertitel.', 'Der erste Schnitt', 'Weglassen als wichtigstes Werkzeug.')]),

  // ── Leben & Gemeinschaft ───────────────────────────────────────
  K('gewaltfreie-kommunikation', 'Gewaltfreie Kommunikation', 'Leben & Gemeinschaft', 60,
    'Beobachten, fühlen, brauchen, bitten: die vier Schritte, die Konflikte in Verbindung verwandeln.', [
    M('Die vier Schritte', 'Beobachtung, Gefühl, Bedürfnis, Bitte.', 'Beobachten ohne zu bewerten', 'Der schwierigste der vier Schritte.'),
    M('Empathisch zuhören', 'Hinter den Worten das Bedürfnis hören.', 'Die Giraffenohren', 'Zuhören, ohne sich zu verteidigen.'),
    M('Im Konflikt', 'GFK, wenn es wirklich schwer wird.', 'Wenn der andere schreit', 'Selbstempathie zuerst.')]),
  K('gemeinschaft-gruenden', 'Gemeinschaft gründen – Wohnprojekte & Ökodörfer', 'Leben & Gemeinschaft', 90,
    'Von der Idee zum Lebensort: Visionen, Entscheidungsformen, Rechtsformen und Finanzierung — mit Erfahrungen aus Awen und SOSO Space.', [
    M('Die Vision', 'Was wollen wir gemeinsam — und was nicht?', 'Die Visionsrunde', 'Eine Methode für den ersten Abend.'),
    M('Entscheiden', 'Konsens, Konsent, Soziokratie.', 'Konsent statt Konsens', 'Wie Gruppen handlungsfähig bleiben.'),
    M('Rechtsform und Geld', 'Verein, Genossenschaft, Stiftung.', 'Welche Form zu euch passt', 'Die gängigen Rechtsformen im Vergleich.')]),
  K('tauschen-teilen', 'Tauschen, Teilen, Schenken – Wirtschaft der Gemeinschaft', 'Leben & Gemeinschaft', 40,
    'Tauschbörsen, Zeitbanken und Schenkkreise: wie Gemeinschaften ohne Geld Werte schaffen — so wie auf den Pinnwänden des Vereins.', [
    M('Jenseits des Geldes', 'Was Wert eigentlich ist.', 'Die Geschichte des Tauschens', 'Von der Gabe zur Münze und zurück.'),
    M('Modelle', 'Tauschbörse, Zeitbank, Regionalwährung.', 'Eine Stunde ist eine Stunde', 'Wie Zeitbanken funktionieren.'),
    M('Selbst starten', 'Eine Tauschgruppe in deinem Ort.', 'Der erste Tauschtisch', 'Klein anfangen, verlässlich bleiben.')]),
  K('beziehungen', 'Beziehungen & Partnerschaft', 'Leben & Gemeinschaft', 60,
    'Nähe, Freiheit und Wachstum in Beziehungen: Bindung verstehen, Konflikte klären, Liebe lebendig halten.', [
    M('Bindung', 'Wie frühe Erfahrungen heutige Beziehungen prägen.', 'Dein Bindungsmuster', 'Sich selbst besser verstehen.'),
    M('Klären', 'Streiten, ohne sich zu verlieren.', 'Das Zwiegespräch', 'Eine Gesprächsform für Paare.'),
    M('Lebendig bleiben', 'Rituale, Freiraum und Wachstum.', 'Ein Abend pro Woche', 'Warum Verabredungen Beziehungen retten.')]),
  K('traeume-verwirklichen', 'Träume verwirklichen – Vom Wunsch zum Plan', 'Leben & Gemeinschaft', 70,
    'Die eigene Vision finden, in Schritte übersetzen und dranbleiben. Das Handwerk hinter jedem großen Lebensentwurf.', [
    M('Die Vision', 'Was willst du wirklich?', 'Der Brief an dein zukünftiges Ich', 'Eine Schreibübung, die Klarheit bringt.'),
    M('Der Plan', 'Ziele, Etappen, erste Schritte.', 'Die kleinste nächste Handlung', 'Warum große Pläne an kleinen Schritten hängen.'),
    M('Dranbleiben', 'Gewohnheiten, Rückschläge, Gemeinschaft.', 'Wenn es nicht klappt', 'Rückschläge als Teil des Weges.')]),
  K('retreat-leitung', 'Retreats & Seminare leiten – Räume halten', 'Leben & Gemeinschaft', 90,
    'Für alle, die ihr Wissen weitergeben wollen: Retreats planen, Gruppen führen und sichere Räume halten.', [
    M('Planung', 'Ort, Ablauf, Kalkulation.', 'Der Ablauf eines Tages', 'Rhythmus zwischen Übung, Pause und Stille.'),
    M('Gruppen führen', 'Ankommen, Dynamik, Konflikte.', 'Die erste Runde', 'Wie eine Gruppe zur Gruppe wird.'),
    M('Sichere Räume', 'Grenzen, Einverständnis, Nachsorge.', 'Verantwortung übernehmen', 'Was ein sicherer Raum braucht.')]),

  // ── Geld & Beruf ───────────────────────────────────────────────
  K('finanzielle-freiheit', 'Finanzielle Freiheit – Budget, Schulden, Rücklagen', 'Geld & Beruf', 50,
    'Überblick über das eigene Geld gewinnen: Budget, Schuldenabbau und Rücklagen. Mit Budgetplan zum Ausfüllen.', [
    M('Der Überblick', 'Was reinkommt, was rausgeht.', 'Ein Monat ehrlich aufgeschrieben', 'Der Budgetplan als Werkzeug.'),
    M('Schulden abbauen', 'Schneeball- und Lawinenmethode.', 'Der erste Schritt raus', 'Welche Schuld zuerst.'),
    M('Rücklagen', 'Notgroschen, Ziele, Gelassenheit.', 'Drei Monate Freiheit', 'Warum ein Polster Entscheidungen frei macht.')]),
  K('berufung', 'Berufung finden – Arbeit, die zu dir passt', 'Geld & Beruf', 60,
    'Stärken, Werte und Leidenschaften zusammenbringen — und Wege finden, davon zu leben, ohne sich zu verbiegen.', [
    M('Wer du bist', 'Stärken, Werte, Talente.', 'Das Ikigai-Modell', 'Vier Fragen, ein Schnittpunkt.'),
    M('Möglichkeiten', 'Anstellung, Selbstständigkeit, Mischformen.', 'Viele Wege nach Rom', 'Berufung muss kein Beruf sein.'),
    M('Der Übergang', 'Schritt für Schritt statt Sprung ins Leere.', 'Das Nebenprojekt', 'Neues ausprobieren, ohne alles zu riskieren.')]),
  K('selbststaendig-mit-herz', 'Selbstständig mit Herz – Gründen ohne Ausbeutung', 'Geld & Beruf', 80,
    'Ein eigenes Angebot aufbauen, faire Preise finden und wirtschaften, ohne sich selbst oder andere auszubeuten.', [
    M('Das Angebot', 'Was du gibst und wem es hilft.', 'Dein Angebot in einem Satz', 'Klarheit vor Marketing.'),
    M('Faire Preise', 'Kalkulation, Wert und Zugänglichkeit.', 'Der Preis, der trägt', 'Stundensatz ehrlich berechnen.'),
    M('Nachhaltig wirtschaften', 'Buchhaltung, Rücklagen, Grenzen.', 'Nein sagen als Geschäftsgrundlage', 'Warum Grenzen Kunden schützen.')]),
  K('online-praesenz', 'Online sichtbar werden – mit Haltung', 'Geld & Beruf', 60,
    'Website, Social Media und Newsletter so nutzen, dass sie dir dienen — ehrlich, ruhig und ohne Aufmerksamkeitsjagd.', [
    M('Die eigene Stimme', 'Worüber du sprichst und für wen.', 'Drei Themen, die dich tragen', 'Eine Übung zur inhaltlichen Klarheit.'),
    M('Kanäle', 'Website, Newsletter, Social Media.', 'Die Heimat im Netz', 'Warum die eigene Seite wichtiger ist als jede Plattform.'),
    M('Rhythmus', 'Regelmäßig, aber nicht getrieben.', 'Ein Beitrag pro Woche', 'Ein Plan, der zu einem Leben passt.')]),

  // ── Kinder & Familie ───────────────────────────────────────────
  K('lebensschule-kinder', 'Lebensschule für Kinder – Träume leben lernen', 'Kinder & Familie', 60,
    'Für Kinder und ihre Eltern: Gefühle verstehen, eigene Stärken entdecken, Träume ernst nehmen. Eine Anleitung fürs Leben, die in der Schule fehlt.', [
    M('Wer bin ich?', 'Stärken, Vorlieben, Gefühle.', 'Meine Superkraft', 'Kinder entdecken, was sie gut können.'),
    M('Gefühle', 'Wut, Angst, Freude, Traurigkeit.', 'Das Gefühlswetter', 'Gefühle benennen wie das Wetter.'),
    M('Meine Träume', 'Wünsche, Ziele, erste Schritte.', 'Die Traumkiste', 'Wie aus einem Traum ein Plan wird.')]),
  K('natur-entdecker-kinder', 'Natur-Entdecker für Kinder', 'Kinder & Familie', 40,
    'Draußen lernen mit allen Sinnen: Pflanzen, Tiere, Spuren und Jahreszeiten — Abenteuer für Familien.', [
    M('Mit allen Sinnen', 'Hören, riechen, tasten im Wald.', 'Die Stille-Minute', 'Wie viele Geräusche hörst du?'),
    M('Tiere und Spuren', 'Wer war hier?', 'Detektive im Wald', 'Spuren lesen wie ein Förster.'),
    M('Pflanzen', 'Erkennen, sammeln, schützen.', 'Das Blätter-Memory', 'Ein Spiel zum Bestimmen.')]),
  K('qigong-kinder', 'Qi-Gong & Bewegung für Kinder', 'Kinder & Familie', 40,
    'Tierbewegungen, Atemspiele und kleine Ruherituale: Qi-Gong kindgerecht, für zu Hause und in der Gruppe.', [
    M('Tierbewegungen', 'Kranich, Bär, Tiger, Affe, Hirsch.', 'Der Kranich', 'Auf einem Bein stehen und fliegen lernen.'),
    M('Atemspiele', 'Ballon, Feder, Blume.', 'Die Pusteblume', 'Ruhig werden mit einem Atemspiel.'),
    M('Zur Ruhe kommen', 'Kleine Rituale für den Abend.', 'Das Abendritual', 'Fünf Minuten, bevor das Licht ausgeht.')]),
  K('freies-lernen', 'Freies Lernen – Bildung jenseits der Schulbank', 'Kinder & Familie', 70,
    'Für Eltern und Begleiter: wie Kinder aus Neugier lernen, welche Wege es gibt und wie man sie im Alltag begleitet.', [
    M('Wie Kinder lernen', 'Neugier, Spiel, Nachahmung.', 'Lernen ist angeboren', 'Was die Forschung über Neugier weiß.'),
    M('Wege', 'Freie Schulen, Lerngruppen, Familienlernen.', 'Welche Wege es gibt', 'Ein Überblick über Möglichkeiten und rechtlichen Rahmen.'),
    M('Begleiten', 'Umgebung gestalten, Fragen stellen, vertrauen.', 'Die vorbereitete Umgebung', 'Räume, die zum Lernen einladen.')]),

  // ── Technik & KI ───────────────────────────────────────────────
  K('ki-verstehen', 'KI verstehen – Mensch, Natur und Maschine', 'Technik & KI', 60,
    'Was künstliche Intelligenz ist, was sie kann und was nicht — und wie wir sie so nutzen, dass sie Mensch und Natur dient.', [
    M('Wie KI funktioniert', 'Muster, Daten, Modelle — ohne Mathematik erklärt.', 'Eine Maschine, die Muster erkennt', 'Die Grundidee in zehn Minuten.'),
    M('Chancen und Grenzen', 'Wo KI hilft und wo sie irrt.', 'Wenn die Maschine sich irrt', 'Warum Prüfen Pflicht bleibt.'),
    M('KI im Dienst des Lebens', 'Natur, Gemeinschaft, Bildung.', 'Werkzeug statt Herrscher', 'Eine Haltung für den Umgang mit KI.')]),
  K('digitale-selbstverteidigung', 'Digitale Selbstverteidigung – Privatsphäre & Sicherheit', 'Technik & KI', 50,
    'Passwörter, Verschlüsselung, Datenspuren und sichere Kommunikation — verständlich und sofort umsetzbar.', [
    M('Deine Datenspur', 'Was über dich gesammelt wird.', 'Wer weiß was über dich?', 'Eine Selbstsuche im Netz.'),
    M('Grundschutz', 'Passwörter, Zwei-Faktor, Updates.', 'Der Passwortmanager', 'Die wichtigste Maßnahme zuerst.'),
    M('Sicher kommunizieren', 'Verschlüsselte Messenger und E-Mail.', 'Ende-zu-Ende erklärt', 'Was Verschlüsselung schützt und was nicht.')]),
];
