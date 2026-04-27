# 🏴‍☠️ Draven_Hack

> Bot de WhatsApp basado en **Baileys** para recuperar archivos de “ver una sola vez” (foto, video y audio) y guardarlos en el almacenamiento del dispositivo.  

---

## 🚀 Características

Draven_Hack recupera contenido de “ver una sola vez” y lo guarda localmente de forma silenciosa.

- **Recupera:** Imágenes, Videos y Audios de "View Once".
- **Sistema Modular:** Estructura organizada por subcarpetas de comandos.
- **Acceso Restringido:** Solo el número configurado como **Owner** puede ejecutar comandos.
- **Auto-Guardado:** Los archivos se almacenan en:
  ```text
  storage/shared/DravenHack/
  ```
### 🏷️ Gestión de Aliases (Personalización)
Puedes añadir nuevos apodos a tus comandos directamente desde WhatsApp sin editar el código. El sistema sumará el nuevo alias y lo mostrará en el menú automáticamente.

**Comando:**
```bash
.addalias [comando_base] [nuevo_alias]
```

**Ejemplos:**
```bash
.addalias vv ver
.addalias menu help
```

---

## 📂 Estructura del Proyecto


```text
Draven_Hack/
├── auth_info/          # Sesión de WhatsApp (No compartir)
├── commands/           # Carpeta de comandos modulares
│   ├── Añadidor_de_Aliases/
│   │   └── addalias.js # Gestionar aliases desde WA
│   ├── menu/
│   │   └── menu.js     # Menú automático e inteligente
│   └── View_Once/
│       └── vv.js       # Comando principal de recuperación
├── storage/            # Carpeta de salida de archivos (Android)
├── index.js            # Punto de entrada del bot
├── package.json        # Dependencias
└── README.md           # Documentación
```

---

## 📥 Instalación

### 📱 Android (Termux)


```bash
pkg update && pkg upgrade -y
```

```bash
pkg install git nodejs -y
```

```bash
termux-setup-storage
```

```bash
git clone https://github.com/BrayanRK/Draven_Hack
```

```bash
cd Draven_Hack
```

```bash
npm install
```

```bash
node index.js
```


### 💻 PC (Windows / Linux)

```bash
git clone https://github.com/BrayanRK/Draven_Hack
cd Draven_Hack
npm install
node index.js
```

---

## 🧠 Uso

### Comandos y Aliases Automáticos

El bot detecta automáticamente los aliases configurados en cada archivo `.js`.

- **Comando principal:** `.vv` (Responde a un mensaje de ver una vez)
- **Aliases configurados:** `.ver`, `.viewonce`, `.revelar`, `.jajaja`, `.bella`, etc.
- **Gestión:** `.menu` para ver la lista completa actualizada.

### Flujo de uso
1. Recibes un archivo de “ver una vez”.
2. Respondes a ese mensaje con `.vv` o cualquier alias.
3. El archivo se guarda en `/storage/shared/DravenHack/` con un nombre único basado en el tiempo.

---

## ⚙️ Configuración

Edita tu número en `index.js`:

```javascript
const OWNER_NUMBER = "573223090406"; // Sin + y con código de país
```

---

## 🔐 Seguridad y Advertencia

> ⚠️ **IMPORTANTE:** Nunca subas tu carpeta `auth_info/` a GitHub, ya que contiene las llaves de acceso a tu WhatsApp.

**Descargo de responsabilidad:** Este bot es para uso personal y educativo. El creador no se hace responsable por el mal uso de esta herramienta o la infracción de los términos de servicio de WhatsApp.

---

## 👨‍💻 Autor

**BrayanRK**  
[GitHub Profile](https://github.com/BrayanRK)
