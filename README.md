# NetGuard 6 – Operation Zero Trust (IPv6 Security Drill)

**NetGuard 6** ist eine spezialisierte React-Anwendung zur Simulation von Sicherheitsvorfällen in IPv6-Netzwerken. Als "Junior Admin" der Datafort GmbH bearbeitest du sieben kritische Sicherheits-Tickets, analysierst Wireshark-Logs und implementierst strukturelle Lösungen auf Cisco-Hardware.

---

## 🚀 Key Features

* **7 High-Security Missionen:** Deckt fortgeschrittene Angriffsvektoren wie NDP-Spoofing, Tunnel-Exfiltration und EUI-64-Tracking ab.
* **Realistisches Incident-Response-Feeling:**
    * Analyse von echten Log-Dateien und Wireshark-Captures.
    * Unterscheidung zwischen Symptombehandlung und strukturellen Lösungen (First Hop Security).
* **Technische Tiefe:** * Bereitstellung echter **Cisco IOS Konfigurationen** für jede Lösung.
    * "Deep Dive"-Sektionen mit Verweisen auf relevante RFCs (z. B. RFC 4890, RFC 6105).
* **Ranking-System:** Deine Leistung wird bewertet – vom "Trainee" bis zum "Chief Security Officer".
* **Immersives Design:** Hochwertiges Cyber-Security-Interface mit Scanlines, Glow-Effekten und Terminal-Ästhetik auf Basis von Tailwind CSS.

---

## 🛠 Tech Stack

* **Framework:** [React.js](https://reactjs.org/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Icons:** [Lucide-React](https://lucide.dev/)
* **Fonts:** Google Fonts (JetBrains Mono & Outfit)

---

## 📚 Missions-Logbuch

| Code | Mission | Fokus-Thema |
| :--- | :--- | :--- |
| **M-01** | PHANTOM GATEWAY | Rogue Router Advertisement & RA-Guard |
| **M-02** | PERMISSION DENIED | ICMPv6 Filtering & RFC 4890 (Path MTU Discovery) |
| **M-03** | MAC TRACE | EUI-64 Adressbildung & Privacy Extensions |
| **M-04** | DOPPELGÄNGER | NDP-Spoofing & IPv6 Snooping / Inspection |
| **M-05** | HIDDEN CHANNEL | IPv6 Transition Tunnels (6to4, Teredo, ISATAP) |
| **M-06** | DUAL STACK AUDIT | Firewall-Management & Implizite IPv6-Lücken |
| **M-07** | DHCP IMPOSTER | Rogue DHCPv6 & First Hop Security (FHS) |

---

## 💻 Integration

1.  **Dependencies installieren:**
    ```bash
    npm install lucide-react
    ```

2.  **Tailwind Konfiguration:**
    Stelle sicher, dass Tailwind CSS in deinem Projekt aktiv ist.

3.  **Komponente nutzen:**
    ```jsx
    import NetGuard6 from './components/NetGuard6';

    export default function SecurityTraining() {
      return <NetGuard6 />;
    }
    ```

---

## 🎯 Lernziele

Diese Anwendung ist perfekt geeignet für:
* **Security Audits:** Vorbereitung auf Pentests im IPv6-Umfeld.
* **Zertifizierungen:** Praktisches Wissen für CCNP oder CompTIA Security+.
* **Berufsausbildung:** Vertiefung administrativer Netzwerk-Sicherheit.

---

> **Sicherheitshinweis:** Die gezeigten Cisco-Befehle sind Best-Practices. Teste Konfigurationen immer erst in einer Laborumgebung.
