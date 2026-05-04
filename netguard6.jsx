import { useState, useEffect } from ‘react’;
import {
Shield, AlertTriangle, CheckCircle2, XCircle, Terminal, Lock,
Wifi, Cpu, Zap, ArrowRight, RotateCcw, Trophy, Activity,
Radio, Network, Eye, FileWarning, Layers, Server
} from ‘lucide-react’;

// =============================================================
// MISSIONSDATEN
// =============================================================

const missions = [
{
id: 1,
code: ‘M-01’,
icon: Radio,
title: ‘PHANTOM GATEWAY’,
threat: ‘Rogue Router Advertisement’,
briefing:
‘Mehrere Mitarbeiter im Subnetz 2001:db8:42::/64 berichten, dass der Internetzugang plötzlich extrem langsam ist. Dein Monitoring zeigt, dass ein neuer Default-Router auf dem Segment auftaucht – mit höherer Präferenz als dein offizielles Gateway. Du befürchtest einen Man-in-the-Middle-Angriff.’,
log: `[NDPMON] RA received from fe80::dead:beef:cafe:1 Source MAC:  aa:bb:cc:11:22:33   (NICHT registriert!) Prefix:      2001:db8:42::/64 Preference:  HIGH Lifetime:    1800s [NDPMON] RA received from fe80::1   (legitimes Gateway) Preference:  MEDIUM`,
question: ‘Welche Maßnahme stoppt diesen Angriffsvektor strukturell – nicht nur den aktuellen Vorfall?’,
options: [
{
text: ‘Statische ARP-Einträge auf allen Clients setzen’,
correct: false,
explanation:
‘ARP existiert in IPv6 nicht mehr. Die Funktion übernimmt das Neighbor Discovery Protocol (NDP), und Router-Werbung läuft über ICMPv6 Type 134 (RA). Die Maßnahme adressiert die falsche Protokollebene.’
},
{
text: ‘RA-Guard auf den Access-Switches aktivieren’,
correct: true,
explanation:
‘Korrekt. RA-Guard (RFC 6105) filtert auf L2 alle Router Advertisements, die nicht von autorisierten Router-Ports stammen. Da Endgeräte niemals RAs senden dürfen, ist das eine saubere strukturelle Lösung.’
},
{
text: ‘ICMPv6 auf den betroffenen Ports vollständig blockieren’,
correct: false,
explanation:
‘Fataler Eingriff. ICMPv6 ist in IPv6 nicht optional – ohne ICMPv6 funktionieren NDP, SLAAC und Path MTU Discovery nicht mehr. Das gesamte Subnetz wäre handlungsunfähig.’
},
{
text: ‘Den Switch-Port des Angreifers manuell deaktivieren’,
correct: false,
explanation:
‘Reagiert nur auf das Symptom. Beim nächsten Angriff von einem anderen Port wiederholt sich das Problem. Strukturelle Schutzmaßnahmen wirken auf Protokollebene.’
}
],
cisco: `! RA-Guard Policy für Endgeräte-Ports
ipv6 nd raguard policy HOST_POLICY
device-role host

! RA-Guard Policy für Uplinks zu legitimen Routern
ipv6 nd raguard policy ROUTER_POLICY
device-role router

! Anwendung auf Access-Port (Endgerät)
interface GigabitEthernet0/1
switchport mode access
ipv6 nd raguard attach-policy HOST_POLICY

! Anwendung auf Uplink zum Default-Gateway
interface GigabitEthernet0/24
ipv6 nd raguard attach-policy ROUTER_POLICY`,
deepDive:
‘RA-Spoofing ist unter IPv6 trivialer als ARP-Spoofing unter IPv4: Ein einzelner Tool-Aufruf (z. B. “fake_router6” aus dem THC-IPv6-Toolkit) reicht. Da Clients im Default RAs auch ohne Authentifizierung akzeptieren, ist die Schutzmaßnahme zwingend Teil des First-Hop-Security-Konzepts.’
},

{
id: 2,
code: ‘M-02’,
icon: AlertTriangle,
title: ‘PERMISSION DENIED’,
threat: ‘Über-restriktive ICMPv6-Filter’,
briefing:
‘Nach einer Firewall-Härtung berichten Nutzer, dass HTTPS-Verbindungen zu manchen Servern nach einigen Sekunden hängen bleiben. Pings von außen funktionieren nicht – das war beabsichtigt. Aber etwas anderes ist kaputtgegangen.’,
log: `# Aktuelle WAN-Eingangsregel:
ipv6 access-list WAN_IN
deny icmp any any
permit tcp any any established
deny ipv6 any any log

# Symptom: TCP-Verbindungen mit großen Paketen brechen ab.

# Klein bleibende Sessions (z.B. SSH-Login) funktionieren.`,

```
question: 'Welche ICMPv6-Typen MÜSSEN durch das Perimeter-WAN erlaubt werden, damit das Internet funktioniert?',
options: [
  {
    text: 'Nur Echo Request (128) und Echo Reply (129)',
    correct: false,
    explanation:
      'Echo dient nur Diagnose-Zwecken. Die kritischen Typen für die Funktion sind die Fehlermeldungen 1–4, insbesondere "Packet Too Big".'
  },
  {
    text: 'Type 1 (Destination Unreachable), 2 (Packet Too Big), 3 (Time Exceeded), 4 (Parameter Problem)',
    correct: true,
    explanation:
      'Genau. Diese vier Fehlertypen bilden RFC 4890 als "MUST-permit" am Perimeter ab. Type 2 ist der Schlüssel: IPv6-Router fragmentieren nicht, daher informiert "Packet Too Big" den Sender über die richtige MTU. Ohne diese Meldung bricht Path MTU Discovery zusammen – TLS-Handshakes hängen.'
  },
  {
    text: 'Router Advertisement (134) und Neighbor Solicitation (135)',
    correct: false,
    explanation:
      'Diese Typen sind link-lokal und dürfen niemals durchs WAN. Sie passieren auf demselben physischen Segment und wären als externe Pakete ein klares Angriffsindiz.'
  },
  {
    text: 'ICMPv6 sollte komplett offen sein, das ist die einzige saubere Lösung',
    correct: false,
    explanation:
      'Zu pauschal. RFC 4890 differenziert klar zwischen MUST-permit, SHOULD-permit und MUST-drop. Ein offenes ICMPv6 ermöglicht etwa Reconnaissance durch unaufgeforderte Router Solicitations.'
  }
],
cisco: `! WAN-Eingangs-ACL nach RFC 4890 (Auszug)
```

ipv6 access-list WAN_IN
! MUST permit – essenzielle Fehlermeldungen
permit icmp any any unreachable
permit icmp any any packet-too-big
permit icmp any any time-exceeded
permit icmp any any parameter-problem

! SHOULD permit – Diagnose (policyabhängig)
permit icmp any any echo-request
permit icmp any any echo-reply

! MUST drop – darf nie aus dem WAN kommen
deny icmp any any router-advertisement
deny icmp any any router-solicitation
deny icmp any any nd-na
deny icmp any any nd-ns
deny icmp any any redirect

! Restliche Policy
permit tcp any any established
deny ipv6 any any log

interface GigabitEthernet0/0
ipv6 traffic-filter WAN_IN in`,
deepDive:
‘Der Klassiker dieses Fehlers: Admins migrieren ihre IPv4-Mentalität (“ICMP ist Diagnose, kann weg”) nach IPv6. Da IPv6 keine Router-Fragmentierung mehr kennt, ist Type 2 protokollkritisch. Ein gefilterter Type 2 wird oft erst durch leise Performance-Probleme bemerkt – TLS, VPN-Tunnel und große HTTP-Responses sind die typischen Opfer.’
},

{
id: 3,
code: ‘M-03’,
icon: Eye,
title: ‘MAC TRACE’,
threat: ‘Adressrückführung & Privacy-Leak’,
briefing:
‘Ein Pentester hat dir folgende Adresse aus einem Audit-Report geschickt, die er aus dem Public-DNS gezogen hat. Er behauptet, daraus sicherheitsrelevante Informationen ableiten zu können. Du musst entscheiden: bluff oder reales Problem?’,
log: `Audit-Befund:
Hostname:   workstation-mueller.firma.de
Adresse:    2001:db8:1::21a:2bff:fe3c:4d5e

→ Notebook eines Mitarbeiters, der häufig im Außendienst ist.
→ Adresse erscheint identisch in Logs aus 3 verschiedenen Netzen.`, question: 'Was verrät diese Adresse, und welche strukturelle Maßnahme behebt das Problem?', options: [ { text: 'Nichts Besonderes – /64-Adressen sind ohnehin zufällig', correct: false, explanation: 'Das gilt nur, wenn Privacy Extensions aktiv sind. Hier sehen wir das klassische ff:fe-Muster in der Mitte (21a:2b**ff:fe**3c:4d5e) – das ist eine EUI-64-Adresse. Sie wurde aus der MAC-Adresse 00:1a:2b:3c:4d:5e abgeleitet (mit invertiertem U/L-Bit).' }, { text: 'Die Adresse leitet sich aus der MAC-Adresse ab. Privacy Extensions (RFC 4941/8981) auf dem Client aktivieren', correct: true, explanation: 'Korrekt. Das ff:fe-Muster zwischen den Bytes 4 und 5 des Interface Identifier ist die Signatur von EUI-64. Konsequenz: Die Hardware-MAC ist global sichtbar, das Gerät ist netzübergreifend trackbar (Außendienst!), und die OUI verrät den Hersteller. Privacy Extensions erzeugen temporäre, zufällige Interface IDs.' }, { text: 'Die Adresse ist kompromittiert. Sofort firmenweite Adresswechsel-Kampagne starten', correct: false, explanation: 'Übersteuert. Eine einzelne Adresse zu wechseln löst das Problem nicht – das Problem ist die strukturelle Konfiguration der SLAAC-Adressbildung. Privacy Extensions adressieren das auf Konfigurationsebene.' }, { text: 'Die Adresse zeigt ein gehacktes Gerät, da sie ungewöhnliche Bytes enthält', correct: false, explanation: 'Falsche Schlussfolgerung. Die Adresse ist technisch völlig normal – sie ist nur datenschutzrechtlich problematisch, weil sie persistent und hardwaregebunden ist.' } ], cisco: `! Hinweis: Privacy Extensions sind eine HOST-Konfiguration,
! kein Cisco-IOS-Feature für Switches/Router.

! ===== Windows (PowerShell als Admin) =====
Set-NetIPv6Protocol -UseTemporaryAddresses Enabled
Set-NetIPv6Protocol -RandomizeIdentifiers Enabled

! ===== Linux (systemd-networkd / sysctl) =====
sysctl -w net.ipv6.conf.all.use_tempaddr=2
sysctl -w net.ipv6.conf.default.use_tempaddr=2

! ===== Server-Best-Practice (Cisco IOS) =====
! Keine EUI-64 für Server-Interfaces verwenden:
interface GigabitEthernet0/0
! NICHT: ipv6 address 2001:db8::/64 eui-64
ipv6 address 2001:db8::a:b:c:1/64    ! manuell, schwer ratbar`,
deepDive:
‘Der Adressraum von /64 (~1,8×10¹⁹) macht klassische Port-Scans unpraktikabel. Angreifer scannen daher gezielt vorhersagbare Adressen: Low-IIDs (::1, ::2, ::25, ::53), EUI-64 (durch OUI-Kenntnis vorhersagbar), und DNS-basierte Aufzählung. Privacy Extensions schützen Clients; für Server gilt: keine EUI-64, keine niedrigen IIDs.’
},

{
id: 4,
code: ‘M-04’,
icon: Network,
title: ‘DOPPELGÄNGER’,
threat: ‘NDP-Spoofing’,
briefing:
‘Ein Wireshark-Trace im Server-VLAN zeigt mehrere Neighbor Advertisements für die Gateway-Adresse fe80::1, jedoch mit unterschiedlichen Link-Layer-Adressen. Du vermutest, dass jemand versucht, sich als Gateway auszugeben.’,
log: `[capture summary] 14:22:01.123  NA  fe80::1  src-MAC: 00:11:22:33:44:55  (legitim) 14:22:01.847  NA  fe80::1  src-MAC: aa:bb:cc:dd:ee:ff  (UNBEKANNT) 14:22:02.301  NA  fe80::1  src-MAC: 00:11:22:33:44:55 14:22:02.512  NA  fe80::1  src-MAC: aa:bb:cc:dd:ee:ff 14:22:03.011  NA  fe80::1  src-MAC: aa:bb:cc:dd:ee:ff Override-Flag: SET`,
question: ‘Welche Schutzmaßnahme deckt NDP-Spoofing systematisch ab – idealerweise in Kombination mit RA-Guard?’,
options: [
{
text: ‘IPv6 NDP Inspection in Verbindung mit IPv6 Snooping (Binding-Tabelle)’,
correct: true,
explanation:
‘Genau. Die Binding-Tabelle (über IPv6 Snooping aufgebaut) lernt valide IPv6-zu-MAC-zu-Port-Zuordnungen. NDP Inspection prüft eingehende NS/NA gegen diese Tabelle und verwirft Spoofing-Versuche. Zusammen mit RA-Guard und DHCPv6 Guard ergibt das First Hop Security (FHS).’
},
{
text: ‘SEND (Secure Neighbor Discovery) flächendeckend ausrollen’,
correct: false,
explanation:
‘Theoretisch die sauberste Lösung (kryptografisch generierte Adressen, RFC 3971), praktisch aber kaum implementiert. Gängige OS-Stacks und Switches unterstützen SEND nur experimentell. Für die produktive Praxis ist FHS der Weg.’
},
{
text: ‘Statische Neighbor-Cache-Einträge auf allen Hosts pflegen’,
correct: false,
explanation:
‘Operativ in größeren Netzen nicht skalierbar. Lediglich für besonders kritische Hosts (Router, zentrale Server) sinnvoll als ergänzende Maßnahme.’
},
{
text: ‘Den IPv6-Stack temporär deaktivieren, bis das Problem behoben ist’,
correct: false,
explanation:
‘Keine Lösung. Der Stack ist nicht das Problem, sondern eine fehlende L2-Schutzmaßnahme. Ein Rückzug aus IPv6 vergrößert mittelfristig die Angriffsfläche, da viele Geräte IPv6 standardmäßig aktivieren.’
}
],
cisco: `! IPv6 Snooping baut die Binding-Tabelle auf
ipv6 snooping policy SNOOP_HOST
security-level glean
device-role node
protocol dhcp
protocol ndp

! NDP Inspection prüft NS/NA gegen die Binding-Tabelle
ipv6 nd inspection policy NDI_HOST
device-role host
validate source-mac

! Anwendung auf Access-Port
interface GigabitEthernet0/1
ipv6 snooping attach-policy SNOOP_HOST
ipv6 nd inspection attach-policy NDI_HOST

! Statischer Eintrag für kritisches Gateway
ipv6 neighbor binding fe80::1 vlan 10
interface GigabitEthernet0/24 0011.2233.4455`,
deepDive:
‘NDP-Spoofing ist die direkte Übersetzung von ARP-Spoofing nach IPv6. Während ARP-Inspection unter IPv4 als Standard etabliert ist, wird der entsprechende NDP-Schutz oft vergessen – mit fatalen Folgen, weil der Angriff auf Layer 2 unterhalb jeder Firewall liegt.’
},

{
id: 5,
code: ‘M-05’,
icon: Layers,
title: ‘HIDDEN CHANNEL’,
threat: ‘Tunnel-Mechanismen als Sicherheitsumgehung’,
briefing:
‘Deine IPv4-Firewall ist akribisch gepflegt: alle ausgehenden Verbindungen werden inspiziert, Egress-Filter sind aktiv. Trotzdem findest du in einem Audit, dass interne Hosts mit externen IPv6-Diensten kommunizieren – obwohl du gar kein natives IPv6-Routing nach außen hast.’,
log: `# IPv4-Egress-Capture (Außenseite Firewall): proto=41   src=192.0.2.45   dst=192.88.99.1   ! 6to4-Tunnel proto=UDP  src=10.0.5.12    dst=*.teredo.ipv6.microsoft.com:3544 proto=UDP  src=10.0.5.30    dst=isatap.firma.de:??? (DNS-Antwort)`,
question: ‘Welche Maßnahmen bekämpfen IPv6-Tunnel-Mechanismen, die deine IPv4-Firewall umgehen?’,
options: [
{
text: ‘Nur natives IPv6 erlauben und alles andere ignorieren’,
correct: false,
explanation:
‘Greift zu kurz. Solange IPv4-Tunnel zu IPv6 möglich sind, kann internes IPv6 ohne dein Wissen nach außen geschleust werden – an deiner Inspektion vorbei.’
},
{
text: ‘IP-Protokoll 41 am Perimeter blockieren, UDP/3544 (Teredo) sperren, ISATAP-DNS-Auflösung unterbinden, Tunnel-OS-seitig deaktivieren’,
correct: true,
explanation:
‘Vollständige Lösung. Protokoll 41 trägt 6in4 und 6to4. UDP/3544 ist der Teredo-Server-Port. ISATAP nutzt einen DNS-Hostnamen “isatap.<domain>” – ohne A-Record kein Tunnel. Zusätzlich: Per GPO/Konfiguration die Tunnel-Adapter auf Endgeräten deaktivieren.’
},
{
text: ‘Nur die Teredo-Server-Adressen blockieren’,
correct: false,
explanation:
‘Lückenhaft. 6to4 (Protokoll 41) und ISATAP würden weiterlaufen. Außerdem können Angreifer eigene Teredo-Server betreiben.’
},
{
text: ‘Die IPv4-Firewall durch eine reine IPv6-Firewall ersetzen’,
correct: false,
explanation:
‘Adressiert das Problem nicht. Tunnel-Pakete sind aus Sicht der äußeren Schicht IPv4 – es braucht IPv4-seitige Filter UND ein bewusstes Tunnel-Verbot.’
}
],
cisco: `! Perimeter-ACL: Tunnel-Protokolle blockieren
ip access-list extended WAN_TUNNEL_BLOCK
deny   41   any any                       ! 6in4 / 6to4
deny   udp  any any eq 3544                ! Teredo
deny   udp  any eq 3544 any
permit ip   any any

interface GigabitEthernet0/0
ip access-group WAN_TUNNEL_BLOCK in
ip access-group WAN_TUNNEL_BLOCK out

! Bogon-Filter für IPv6 (ULA, Tunnel-Präfixe)
ipv6 access-list IPV6_BOGON
deny ipv6 2002::/16 any        ! 6to4
deny ipv6 2001::/32 any        ! Teredo
deny ipv6 fc00::/7 any         ! ULA – darf nicht extern routen
permit ipv6 any any

! Auf Endgeräten (Windows GPO):
! Computer Configuration > Policies > Admin Templates >
!   Network > TCPIP Settings > IPv6 Transition Technologies
! → 6to4 State: Disabled
! → ISATAP State: Disabled
! → Teredo State: Disabled`,
deepDive:
‘Tunnel-Mechanismen waren als Migrationshilfe gedacht und wurden in vielen Betriebssystemen standardmäßig aktiviert (Windows-Teredo!). In einem produktiven Umfeld mit IPv4-Egress-Filtering bilden sie einen blinden Fleck. Ein Bogon-Filter ist die zweite Verteidigungslinie: 2002::/16 und 2001::/32 dürfen nicht aus deinem Netz heraus, da sie zwingend Tunnel implizieren.’
},

{
id: 6,
code: ‘M-06’,
icon: FileWarning,
title: ‘DUAL STACK AUDIT’,
threat: ‘Implizit offene IPv6-Konfiguration’,
briefing:
‘Du übernimmst ein bestehendes Netzwerk. Die IPv4-Firewall ist exemplarisch konfiguriert. Ein Pentest hat aber ergeben, dass mehrere Server, die in IPv4 streng abgeschottet sind, in IPv6 offen erreichbar sind. Wie kann das sein?’,
log: `# Befund Server "db-prod": ipv4: 198.51.100.50 → IPv4-FW: nur SQL-Port aus DMZ erlaubt. ✓ ipv6: 2001:db8:abc::50 → IPv6-FW: keine Regel definiert. → Nmap aus dem Internet (-6): 22/tcp   open  ssh 3306/tcp open  mysql 8080/tcp open  http-proxy`,
question: ‘Was ist die Ursache, und wie behebst du das Grundproblem strukturell?’,
options: [
{
text: ‘Die IPv4-Regeln gelten automatisch auch für IPv6 – das System hat einen Bug’,
correct: false,
explanation:
‘Genau das ist die Falschannahme, die in der Praxis zu solchen Lücken führt. IPv4- und IPv6-Regelwerke sind getrennt. IPv4-Regeln greifen niemals automatisch für IPv6-Traffic.’
},
{
text: ‘IPv6-Regelwerk separat aufbauen, Default-Policy auf “deny”, dann gezielt freigeben’,
correct: true,
explanation:
‘Korrekt. Viele Firewalls und Hosts haben für IPv6 eine implizite Allow-All-Policy, weil bei der initialen Konfiguration nur IPv4 berücksichtigt wurde. Die einzige saubere Lösung ist ein eigenständiges IPv6-Regelwerk mit “default deny” und expliziter Freigabe – analog zur IPv4-Praxis.’
},
{
text: ‘IPv6 auf allen Servern deaktivieren’,
correct: false,
explanation:
‘Pragmatisch verlockend, aber strategisch falsch. IPv6 ist Standard, viele Dienste nutzen es nativ, und ein deaktivierter Stack auf einem Endgerät schützt nicht vor IPv6-Verkehr im Netzwerk. Der korrekte Weg ist ein durchdachtes IPv6-Sicherheitsmodell.’
},
{
text: ‘Die IPv4-Regeln per Skript in IPv6 umschreiben (Adressen ersetzen)’,
correct: false,
explanation:
‘Riskant. IPv6 erfordert zusätzliche Regeln, die IPv4 gar nicht hat: ICMPv6 nach RFC 4890, Filterung von Extension Headers, NDP-spezifische Regeln. Eine reine Adressersetzung übersieht diese Aspekte.’
}
],
cisco: `! Beispiel: getrennte ACLs für Dual-Stack-Server
! IPv4 (vorhanden, ergänzungshalber)
ip access-list extended DB_PROD_V4
permit tcp 198.51.100.0 0.0.0.255 host 198.51.100.50 eq 3306
deny   ip  any any log

! IPv6 (NEU: explizit aufgebaut)
ipv6 access-list DB_PROD_V6
! ICMPv6-Essentials (RFC 4890)
permit icmp any any unreachable
permit icmp any any packet-too-big
permit icmp any any time-exceeded
permit icmp any any parameter-problem
! Anwendungsverkehr
permit tcp 2001:db8:dmz::/64 host 2001:db8:abc::50 eq 3306
! Default deny
deny   ipv6 any any log

interface GigabitEthernet0/1
ip  access-group  DB_PROD_V4 in
ipv6 traffic-filter DB_PROD_V6 in

! Tipp für die Konsolidierung:
! Auf modernen Linux-Systemen nftables verwenden – dort lassen
! sich IPv4+IPv6 in einer “inet”-Tabelle gemeinsam pflegen.`,
deepDive:
‘Dies ist statistisch der häufigste IPv6-Sicherheitsfehler in produktiven Umgebungen. Auditoren prüfen oft nur IPv4-Regelwerke, während IPv6 unbeachtet aktiv ist. Ein systematischer Test mit “nmap -6 <ipv6-adresse>” deckt diese Lücken auf. Die Lösung ist organisatorisch: IPv6 muss von Anfang an als gleichwertige Protokollebene mit eigenem Regelwerk geplant werden.’
},

{
id: 7,
code: ‘M-07’,
icon: Server,
title: ‘DHCP IMPOSTER’,
threat: ‘Rogue DHCPv6-Server’,
briefing:
‘In einem Subnetz, in dem du DHCPv6 für DNS-Optionen nutzt, melden Clients plötzlich falsche DNS-Server – die auf einen externen IP-Bereich zeigen. Ein gefälschter DHCPv6-Server scheint im Spiel zu sein.’,
log: `Client erhält per DHCPv6:
Server-DUID: 00:01:00:01:??:??:??:??   (UNBEKANNT!)
Option 23 (DNS):  2001:dead:beef::53
Option 24 (Domain): “evil-corp.example”

Legitimer DHCPv6-Server:
Server-DUID: 00:01:00:01:1a:2b:3c:4d
Option 23 (DNS):  2001:db8::53`, question: 'Welche Kombination schützt strukturell vor Rogue DHCPv6 und ergänzt RA-Guard zu einem vollständigen FHS-Setup?', options: [ { text: 'DHCPv6 Guard an allen Access-Ports mit Rolle "client", Server-Rolle nur an autorisierten Uplinks', correct: true, explanation: 'Korrekt. DHCPv6 Guard arbeitet analog zu DHCP Snooping unter IPv4: Client-Ports dürfen nur DHCPv6-Anfragen (Solicit, Request) senden, niemals Antworten (Advertise, Reply). Antworten von Client-Ports werden verworfen. Das ist der vierte Baustein neben RA-Guard, NDP Inspection und IPv6 Snooping.' }, { text: 'SLAAC global erzwingen und DHCPv6 abschalten', correct: false, explanation: 'Funktioniert nur, wenn man auf alle DHCPv6-Optionen verzichten kann. In vielen Umgebungen wird DHCPv6 für DNS-Optionen gebraucht. Außerdem entscheidet das M-/O-Flag im RA, was Clients tun – ein Rogue-RA mit M=1 würde DHCPv6 wieder erzwingen.' }, { text: 'Auf jedem Client den legitimen DHCPv6-Server hart konfigurieren', correct: false, explanation: 'DHCPv6 funktioniert nicht so – Clients senden Solicits per Multicast (ff02::1:2), eine Server-Vorgabe ist nicht das vorgesehene Modell. Die Schutzmaßnahme gehört auf Layer 2, nicht zum Client.' }, { text: 'Den DHCPv6-Multicast (ff02::1:2) komplett blockieren', correct: false, explanation: 'Damit funktioniert auch der legitime DHCPv6-Server nicht mehr. Die Lösung ist port-spezifische Filterung der Server-Antworten, nicht eine pauschale Blockade.' } ], cisco: `! DHCPv6 Guard: Policies definieren
ipv6 dhcp guard policy DHCP_CLIENT_PORT
device-role client

ipv6 dhcp guard policy DHCP_SERVER_PORT
device-role server
trusted-port

! Anwendung: Endgeräte-Port
interface GigabitEthernet0/1
ipv6 dhcp guard attach-policy DHCP_CLIENT_PORT

! Anwendung: Uplink zum legitimen DHCPv6-Server
interface GigabitEthernet0/24
ipv6 dhcp guard attach-policy DHCP_SERVER_PORT

! ===== Vollständiges First Hop Security Setup =====
! (alle vier Bausteine kombiniert auf einem Access-Port)
interface GigabitEthernet0/1
ipv6 nd raguard attach-policy HOST_POLICY
ipv6 nd inspection attach-policy NDI_HOST
ipv6 snooping attach-policy SNOOP_HOST
ipv6 dhcp guard attach-policy DHCP_CLIENT_PORT`,
deepDive:
‘First Hop Security (FHS) ist der industriell etablierte Sammelbegriff für die L2-Schutzmaßnahmen RA-Guard, NDP Inspection, IPv6 Snooping und DHCPv6 Guard. Sie greifen ineinander: Snooping baut die Binding-Tabelle aus DHCPv6 und NDP auf, Inspection nutzt sie zur Validierung, RA-Guard und DHCPv6 Guard verhindern, dass Clients sich als Infrastruktur ausgeben.’
}
];

// =============================================================
// HAUPTKOMPONENTE
// =============================================================

export default function NetGuard6() {
const [stage, setStage] = useState(‘intro’); // intro | mission | feedback | result
const [missionIdx, setMissionIdx] = useState(0);
const [score, setScore] = useState(0);
const [selected, setSelected] = useState(null);
const [history, setHistory] = useState([]); // [{ missionId, correct, optionIdx }]

const current = missions[missionIdx];

const handleSelect = (idx) => {
if (selected !== null) return;
setSelected(idx);
const correct = current.options[idx].correct;
if (correct) setScore(score + 1);
setHistory([…history, { missionId: current.id, correct, optionIdx: idx }]);
setStage(‘feedback’);
};

const handleNext = () => {
if (missionIdx + 1 < missions.length) {
setMissionIdx(missionIdx + 1);
setSelected(null);
setStage(‘mission’);
} else {
setStage(‘result’);
}
};

const restart = () => {
setStage(‘intro’);
setMissionIdx(0);
setScore(0);
setSelected(null);
setHistory([]);
};

return (
<div className="min-h-screen w-full bg-zinc-950 text-zinc-100 relative overflow-hidden">
<FontStyles />
<BackgroundGrid />

```
  <div className="relative z-10 max-w-5xl mx-auto px-6 py-10">
    <Header />

    {stage === 'intro' && <Intro onStart={() => setStage('mission')} />}

    {(stage === 'mission' || stage === 'feedback') && (
      <MissionView
        mission={current}
        missionIdx={missionIdx}
        total={missions.length}
        score={score}
        selected={selected}
        stage={stage}
        onSelect={handleSelect}
        onNext={handleNext}
      />
    )}

    {stage === 'result' && (
      <Result score={score} total={missions.length} history={history} onRestart={restart} />
    )}

    <Footer />
  </div>
</div>
```

);
}

// =============================================================
// SUB-KOMPONENTEN
// =============================================================

function FontStyles() {
return (
<style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Outfit:wght@300;400;600;800&display=swap'); .font-display { font-family: 'Outfit', sans-serif; letter-spacing: -0.02em; } .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; } .font-body { font-family: 'Outfit', sans-serif; } .scanline::before { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient( 0deg, transparent 0px, transparent 3px, rgba(74, 222, 128, 0.03) 3px, rgba(74, 222, 128, 0.03) 4px ); pointer-events: none; mix-blend-mode: screen; } .glow-green { box-shadow: 0 0 24px rgba(74, 222, 128, 0.25), inset 0 0 1px rgba(74, 222, 128, 0.4); } .glow-red { box-shadow: 0 0 24px rgba(248, 113, 113, 0.25), inset 0 0 1px rgba(248, 113, 113, 0.4); } .glow-cyan { box-shadow: 0 0 32px rgba(34, 211, 238, 0.18); } @keyframes pulse-soft { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } } .animate-pulse-soft { animation: pulse-soft 2.4s ease-in-out infinite; } @keyframes blink { 50% { opacity: 0; } } .cursor-blink { animation: blink 1s step-start infinite; } .text-shadow-glow { text-shadow: 0 0 14px rgba(74, 222, 128, 0.5); }`}</style>
);
}

function BackgroundGrid() {
return (
<div
className=“absolute inset-0 opacity-30 pointer-events-none”
style={{
backgroundImage:
‘linear-gradient(rgba(74,222,128,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.06) 1px, transparent 1px)’,
backgroundSize: ‘48px 48px’,
maskImage: ‘radial-gradient(ellipse at center, black 30%, transparent 80%)’
}}
/>
);
}

function Header() {
return (
<div className="flex items-center justify-between mb-10 pb-4 border-b border-zinc-800">
<div className="flex items-center gap-3">
<Shield className="w-7 h-7 text-green-400 text-shadow-glow" />
<div>
<div className="font-display font-bold text-2xl tracking-tight">
NetGuard <span className="text-green-400">6</span>
</div>
<div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
Operation Zero Trust · IPv6 Security Drill
</div>
</div>
</div>
<div className="flex items-center gap-2 font-mono text-xs text-zinc-500">
<Activity className="w-3.5 h-3.5 text-green-400 animate-pulse-soft" />
<span>SYSTEM ONLINE</span>
</div>
</div>
);
}

function Intro({ onStart }) {
return (
<div className="space-y-8">
<div className="relative scanline border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm p-8 rounded-sm">
<div className="font-mono text-xs text-green-400 mb-4 uppercase tracking-widest">
[ Briefing · 04:32:18 UTC ]
</div>
<h1 className="font-display font-extrabold text-5xl md:text-6xl leading-[0.95] mb-6">
Willkommen,<br />
<span className="text-green-400 text-shadow-glow">Junior Admin.</span>
</h1>
<div className="font-body text-lg text-zinc-300 space-y-4 max-w-3xl leading-relaxed">
<p>
Du beginnst heute deinen ersten Tag bei <span className="text-green-400 font-semibold">Datafort GmbH</span>.
Das Unternehmen migriert sein gesamtes Netzwerk auf IPv6 – und ausgerechnet jetzt
häufen sich die Sicherheitsvorfälle.
</p>
<p>
Dein Vorgänger ist im Urlaub, das Telefon klingelt, und auf deinem Bildschirm stapeln
sich die Tickets. <span className="text-cyan-400">Sieben Vorfälle</span> warten auf dich.
Jeder erfordert eine fundierte Entscheidung.
</p>
<p className="text-zinc-400 text-base italic">
Du kennst IPv4. Aber IPv6 ist kein „IPv4 mit längeren Adressen”. Lass dich nicht von
scheinbar vertrauten Mustern täuschen.
</p>
</div>
</div>

```
  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
    <div className="border border-zinc-800 p-4 rounded-sm bg-zinc-900/30">
      <div className="text-green-400 mb-2">▸ FORMAT</div>
      <div className="text-zinc-400">7 Missionen · je 1 Entscheidung · sofortiges Feedback</div>
    </div>
    <div className="border border-zinc-800 p-4 rounded-sm bg-zinc-900/30">
      <div className="text-cyan-400 mb-2">▸ TOOLS</div>
      <div className="text-zinc-400">Cisco IOS · NDPMON · Wireshark · nmap -6</div>
    </div>
    <div className="border border-zinc-800 p-4 rounded-sm bg-zinc-900/30">
      <div className="text-amber-400 mb-2">▸ ZIEL</div>
      <div className="text-zinc-400">Begründete Auswahl · strukturelle Lösungen · keine Symptombehandlung</div>
    </div>
  </div>

  <button
    onClick={onStart}
    className="group flex items-center gap-3 bg-green-400 hover:bg-green-300 text-zinc-950 font-display font-bold text-lg px-8 py-4 rounded-sm transition-all glow-green"
  >
    <Terminal className="w-5 h-5" />
    SCHICHT BEGINNEN
    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
  </button>
</div>
```

);
}

function MissionView({ mission, missionIdx, total, score, selected, stage, onSelect, onNext }) {
const Icon = mission.icon;

return (
<div className="space-y-6">
{/* Status-Bar */}
<div className="flex items-center justify-between font-mono text-xs">
<div className="flex items-center gap-4">
<span className="text-zinc-500">MISSION</span>
<span className="text-green-400 font-bold">
{String(missionIdx + 1).padStart(2, ‘0’)} / {String(total).padStart(2, ‘0’)}
</span>
</div>
<div className="flex items-center gap-2">
<Trophy className="w-3.5 h-3.5 text-amber-400" />
<span className="text-zinc-400">
SCORE: <span className="text-amber-400 font-bold">{score}</span> / {total}
</span>
</div>
</div>

```
  {/* Fortschrittsbalken */}
  <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
    <div
      className="h-full bg-gradient-to-r from-green-400 to-cyan-400 transition-all duration-500"
      style={{ width: `${((missionIdx + (stage === 'feedback' ? 1 : 0)) / total) * 100}%` }}
    />
  </div>

  {/* Mission-Header */}
  <div className="border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm rounded-sm">
    <div className="flex items-center gap-4 p-5 border-b border-zinc-800">
      <div className="w-12 h-12 border border-green-400/40 rounded-sm flex items-center justify-center bg-green-400/5">
        <Icon className="w-6 h-6 text-green-400" />
      </div>
      <div className="flex-1">
        <div className="font-mono text-[10px] text-green-400 uppercase tracking-widest mb-0.5">
          {mission.code} · {mission.threat}
        </div>
        <h2 className="font-display font-extrabold text-3xl tracking-tight">{mission.title}</h2>
      </div>
    </div>

    {/* Briefing */}
    <div className="p-5 border-b border-zinc-800">
      <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-2">
        ▸ Lagebericht
      </div>
      <p className="font-body text-zinc-300 leading-relaxed">{mission.briefing}</p>
    </div>

    {/* Log/Evidence */}
    <div className="p-5 border-b border-zinc-800">
      <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-2">
        ▸ Asservaten · Logs / Capture
      </div>
      <pre className="font-mono text-xs text-green-300/90 bg-zinc-950 border border-zinc-800 p-4 rounded-sm overflow-x-auto whitespace-pre-wrap leading-relaxed">
        {mission.log}
      </pre>
    </div>

    {/* Frage */}
    <div className="p-5">
      <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-3">
        ▸ Entscheidung
      </div>
      <p className="font-body text-lg text-zinc-100 mb-5 leading-snug">{mission.question}</p>

      <div className="space-y-2">
        {mission.options.map((opt, i) => {
          const isSelected = selected === i;
          const showResult = stage === 'feedback';
          const isCorrect = opt.correct;

          let cls =
            'group w-full text-left border rounded-sm p-4 transition-all flex items-start gap-3 ';
          if (!showResult) {
            cls +=
              'border-zinc-800 bg-zinc-900/30 hover:border-green-400/60 hover:bg-zinc-900/60 cursor-pointer';
          } else if (isCorrect) {
            cls += 'border-green-400 bg-green-400/10 glow-green';
          } else if (isSelected && !isCorrect) {
            cls += 'border-red-400 bg-red-400/10 glow-red';
          } else {
            cls += 'border-zinc-800 bg-zinc-900/20 opacity-50';
          }

          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              disabled={showResult}
              className={cls}
            >
              <div className="font-mono text-xs text-zinc-500 mt-0.5">
                {String.fromCharCode(65 + i)}
              </div>
              <div className="flex-1 font-body text-zinc-200 leading-snug">{opt.text}</div>
              {showResult && isCorrect && (
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              )}
              {showResult && isSelected && !isCorrect && (
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  </div>

  {/* Feedback-Bereich */}
  {stage === 'feedback' && (
    <FeedbackPanel mission={mission} selected={selected} onNext={onNext} isLast={missionIdx + 1 === total} />
  )}
</div>
```

);
}

function FeedbackPanel({ mission, selected, onNext, isLast }) {
const opt = mission.options[selected];
const correct = opt.correct;

return (
<div className=“space-y-4 animate-pulse-soft” style={{ animation: ‘none’ }}>
{/* Antwort-Bewertung */}
<div
className={
’border rounded-sm p-5 ’ +
(correct
? ‘border-green-400/60 bg-green-400/5’
: ‘border-red-400/60 bg-red-400/5’)
}
>
<div className="flex items-center gap-3 mb-3">
{correct ? (
<>
<CheckCircle2 className="w-6 h-6 text-green-400" />
<span className="font-display font-bold text-xl text-green-400">RICHTIG</span>
</>
) : (
<>
<XCircle className="w-6 h-6 text-red-400" />
<span className="font-display font-bold text-xl text-red-400">FEHLENTSCHEIDUNG</span>
</>
)}
</div>
<p className="font-body text-zinc-200 leading-relaxed">{opt.explanation}</p>
</div>

```
  {/* Cisco-Konfiguration */}
  <div className="border border-cyan-400/30 bg-zinc-900/40 rounded-sm overflow-hidden">
    <div className="flex items-center gap-2 px-4 py-2 border-b border-cyan-400/20 bg-cyan-400/5">
      <Cpu className="w-4 h-4 text-cyan-400" />
      <span className="font-mono text-xs text-cyan-400 uppercase tracking-widest">
        Cisco IOS · Lösungskonfiguration
      </span>
    </div>
    <pre className="font-mono text-xs text-cyan-100/90 p-4 overflow-x-auto leading-relaxed bg-zinc-950">
      {mission.cisco}
    </pre>
  </div>

  {/* Vertiefung */}
  <div className="border border-zinc-800 bg-zinc-900/40 rounded-sm p-5">
    <div className="flex items-center gap-2 mb-3">
      <Zap className="w-4 h-4 text-amber-400" />
      <span className="font-mono text-xs text-amber-400 uppercase tracking-widest">
        Hintergrund · Vertiefung
      </span>
    </div>
    <p className="font-body text-zinc-300 leading-relaxed">{mission.deepDive}</p>
  </div>

  <button
    onClick={onNext}
    className="group flex items-center gap-3 bg-zinc-100 hover:bg-white text-zinc-950 font-display font-bold px-6 py-3 rounded-sm transition-all"
  >
    {isLast ? 'EINSATZBERICHT EINSEHEN' : 'NÄCHSTE MISSION'}
    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
  </button>
</div>
```

);
}

function Result({ score, total, history, onRestart }) {
const pct = (score / total) * 100;
let rank, rankColor, msg;
if (pct === 100) {
rank = ‘CHIEF SECURITY OFFICER’;
rankColor = ‘text-amber-400’;
msg = ‘Makellos. Du beherrschst First Hop Security, RFC 4890 und die Tunnel-Mechanismen aus dem Effeff.’;
} else if (pct >= 70) {
rank = ‘SENIOR NETWORK ADMIN’;
rankColor = ‘text-green-400’;
msg = ‘Solide Performance. Mit etwas Feinschliff in den verfehlten Bereichen wirst du ein hervorragender IPv6-Operator.’;
} else if (pct >= 40) {
rank = ‘JUNIOR ADMIN · IN AUSBILDUNG’;
rankColor = ‘text-cyan-400’;
msg = ‘Du hast die Grundlagen, aber IPv6 verlangt eine andere Denkweise als IPv4. Wiederhole gezielt die fehlerhaften Missionen.’;
} else {
rank = ‘TRAINEE · WEITERE SCHULUNG NÖTIG’;
rankColor = ‘text-red-400’;
msg = ‘IPv6 ist kein “IPv4 mit längeren Adressen”. Arbeite die Konzepte NDP, ICMPv6 und FHS systematisch durch.’;
}

return (
<div className="space-y-8">
<div className="relative scanline border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm p-8 rounded-sm text-center">
<div className="font-mono text-xs text-green-400 mb-2 uppercase tracking-widest">
[ Schichtende · Bericht ]
</div>
<div className="font-display font-extrabold text-7xl md:text-8xl leading-none mb-3">
<span className={rankColor}>{score}</span>
<span className="text-zinc-600">/{total}</span>
</div>
<div className={’font-display font-bold text-2xl mb-4 ’ + rankColor}>
RANG: {rank}
</div>
<p className="font-body text-zinc-300 max-w-2xl mx-auto leading-relaxed">{msg}</p>
</div>

```
  {/* Mission-Übersicht */}
  <div className="border border-zinc-800 rounded-sm overflow-hidden">
    <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-900/40">
      <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest">
        Mission-Übersicht
      </span>
    </div>
    <div>
      {history.map((h, i) => {
        const m = missions.find((x) => x.id === h.missionId);
        return (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-3 border-b border-zinc-900 last:border-b-0"
          >
            <div className="font-mono text-xs text-zinc-500 w-12">{m.code}</div>
            <div className="flex-1">
              <div className="font-display font-bold text-zinc-200">{m.title}</div>
              <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
                {m.threat}
              </div>
            </div>
            {h.correct ? (
              <div className="flex items-center gap-2 text-green-400 font-mono text-xs">
                <CheckCircle2 className="w-4 h-4" />
                GELÖST
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-400 font-mono text-xs">
                <XCircle className="w-4 h-4" />
                VERFEHLT
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>

  <button
    onClick={onRestart}
    className="group flex items-center gap-3 border-2 border-green-400 hover:bg-green-400 hover:text-zinc-950 text-green-400 font-display font-bold text-lg px-8 py-4 rounded-sm transition-all"
  >
    <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
    NEUER EINSATZ
  </button>
</div>
```

);
}

function Footer() {
return (
<div className="mt-16 pt-6 border-t border-zinc-900 font-mono text-[10px] text-zinc-600 uppercase tracking-widest flex flex-wrap items-center justify-between gap-2">
<span>Datafort GmbH · Internal Training System</span>
<span className="flex items-center gap-2">
<Lock className="w-3 h-3" />
ENCRYPTED CHANNEL <span className="text-green-400 cursor-blink">_</span>
</span>
</div>
);
}