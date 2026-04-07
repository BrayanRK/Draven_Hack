# 🏴‍☠️ Draven_Hack

> Bot de WhatsApp basado en **Baileys** para recuperar archivos de “ver una sola vez” (foto, video y audio) y guardarlos en el almacenamiento del dispositivo.  
> Basado en la librería [Baileys](https://github.com/whiskeysockets/Baileys).

---

## 🚀 Características

Draven_Hack te permite recuperar cualquier contenido de “ver una sola vez” y guardarlo localmente sin dejar rastro en el chat.

- Recupera:
  - Imágenes de ver una vez
  - Videos de ver una vez
  - Audios de ver una vez
- Guarda automáticamente en:

  ```text
  storage/shared/DravenHack/

## 🚀 Características

- Recupera:
  - Imágenes de ver una vez
  - Videos de ver una vez
  - Audios de ver una vez
- Guarda automáticamente en:
```
storage/shared/DravenHack/
```
- Funcionamiento silencioso (no envía nada al chat)
- Sistema modular (index.js + commands/)
- Acceso restringido al owner

---

## 📥 Instalación

### 📱 Android (Termux)

```
pkg update && pkg upgrade
pkg install git nodejs -y
termux-setup-storage
```

```
cd ~
git clone https://github.com/BrayanRK/Draven_Hack.git
cd Draven_Hack
npm install
node index.js
```

Escanea el QR:

WhatsApp > Menú ⋮ > Dispositivos vinculados > Vincular dispositivo

---

### 💻 PC (Windows / Linux)

```
git clone https://github.com/BrayanRK/Draven_Hack.git
cd Draven_Hack
npm install
node index.js
```

---

## 🧠 Uso

### Comando principal

```
.vv
```

### Alias

```
.ver
.viewonce
.revelar
```

### Flujo de uso

1. Recibe un archivo de “ver una vez”
2. Responde a ese mensaje con:

```
.vv
```

3. El archivo se guardará en:

```
storage/shared/DravenHack/
```

Ejemplo:

```
imagen_draven_1712400000000.jpg
video_draven_1712400000000.mp4
audio_draven_1712400000000.ogg
```

Nota: El bot no envía el archivo al chat.

---

## ⚙️ Configuración

Edita tu número en index.js:

```
const OWNER_NUMBER = "573223090406";
```

Ejemplo:

```
const OWNER_NUMBER = "573001234567";
```

Formato:
- Sin +
- Con código de país

---

## 📂 Estructura

```
Draven_Hack/
├── commands/
│   └── vv.js
├── index.js
├── package.json
├── README.md
└── .gitignore
```

---

## 🔐 Seguridad

> auth_info/ → NO subir
> node_modules/ → ignorado

> ⚠️ Nunca subas tu carpeta `auth_info/` (sesión de WhatsApp) a GitHub.
> El bot no responde en el chat, solo guarda los archivos.

---

## 🛠️ Problemas comunes

### No guarda archivos

```
termux-setup-storage
```

Verifica:

```
ls ~/storage/shared/DravenHack
```

---

### No responde

- Usa .vv
- Debe ser el número owner
- Revisa la consola

---

## 🧾 Licencia

MIT License

---

## 👨‍💻 Autor

BrayanRK  
https://github.com/BrayanRK/Draven_Hack

