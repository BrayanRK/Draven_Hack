# Draven_Hack 🏴‍☠️

Bot de WhatsApp basado en **Baileys** para recuperar archivos de **“ver una sola vez”** (foto, video y audio) y guardarlos en el almacenamiento del dispositivo.

> Solo el **dueño** del bot puede ejecutar los comandos.

---

## 🚀 Características

- Recupera:
  - ✅ Imágenes de ver una vez
  - ✅ Videos de ver una vez
  - ✅ Audios de ver una vez
- Guarda los archivos en:
  - `storage/shared/DravenHack/`
- No responde con el archivo en el chat (trabaja **silencioso**).
- Sistema de comandos modular (`index.js` + `commands/`).
- Solo el **número del owner** puede usar los comandos.

---

## 📂 Estructura del proyecto

```bash
Draven_Hack/
├── commands/
│   └── vv.js          # Comando para ver/guardar archivos de una sola vez
├── index.js           # Conexión a WhatsApp + loader de comandos + filtro de owner
├── package.json       # Dependencias y scripts de npm
├── package-lock.json
├── README.md
├── LICENSE
└── .gitignore         # Ignora node_modules y auth_info
