/**
 * Module Open Source : Cookie Banner, Loader & Direct Email Sender via EmailJS SDK
 */
(function() {
    const config = window.COOKIE_PARAM || {};
    const LISTE_PARTENAIRES = config.listePartenaires || [];
    const PUBLIC_KEY = config.emailjsPublicKey;
    const SERVICE_ID = config.emailjsServiceId;
    const TEMPLATE_ID = config.emailjsTemplateId;

    // 1. Injection du module EmailJS depuis le serveur CDN officiel
    const emailScript = document.createElement("script");
    emailScript.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
    document.head.appendChild(emailScript);

    emailScript.onload = function() {
        if (PUBLIC_KEY) {
            emailjs.init({ publicKey: PUBLIC_KEY });
        }
    };

    // Injection automatique des styles CSS (incluant le design du formulaire)
    const css = `
        #js-dynamic-loader {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: #121212; display: flex; justify-content: center;
            align-items: center; z-index: 99999; transition: opacity 0.5s ease, visibility 0.5s ease;
        }
        .js-spinner {
            width: 45px; height: 45px; border: 4px solid #2d2d2d;
            border-top: 4px solid #0084ff; border-radius: 50%;
            animation: js-spin 1s linear infinite;
        }
        @keyframes js-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        #js-cookie-banner {
            position: fixed; bottom: -300px; left: 50%; transform: translateX(-50%);
            width: 90%; max-width: 550px; background: #1e1e1e;
            border: 1px solid #2d2d2d; border-radius: 12px; padding: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.6); z-index: 99998;
            font-family: Arial, sans-serif; color: #ffffff;
            transition: bottom 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            display: flex; flex-direction: column; gap: 12px;
            box-sizing: border-box;
        }
        #js-cookie-banner.active { bottom: 20px; }
        .js-title { font-size: 16px; font-weight: bold; margin: 0; }
        .js-desc { font-size: 13px; color: #b3b3b3; margin: 0; line-height: 1.4; }
        
        /* Style du champ de saisie dynamique */
        .js-input-frame { display: flex; flex-direction: column; gap: 5px; margin-top: 5px; }
        .js-input-frame label { font-size: 12px; color: #0084ff; font-weight: bold; }
        .js-mail-field {
            width: 100%; padding: 10px; background: #2b2b2b; border: 1px solid #444;
            color: #fff; border-radius: 6px; box-sizing: border-box; outline: none; font-size: 14px;
        }
        .js-mail-field:focus { border-color: #0084ff; }
        
        .js-btn-group { display: flex; justify-content: flex-end; gap: 10px; margin-top: 5px; }
        .js-btn { padding: 9px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; border: none; font-size: 13px; }
        .js-btn-accept { background: #0084ff; color: white; }
        .js-btn-deny { background: transparent; color: #888; border: 1px solid #333; }
        .js-btn-deny:hover { background: #252525; color: #fff; }
    `;

    const styleNode = document.createElement("style");
    styleNode.appendChild(document.createTextNode(css));
    document.head.appendChild(styleNode);

    // Extraction ou tentative de recuperation automatique
    function extraireEmailAutomatiquement() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('email')) return urlParams.get('email');
        if (localStorage.getItem('user_email')) return localStorage.getItem('user_email');
        return null; // Renvoie null si aucune adresse n'est pre-existante
    }

    // Initialisation et creation des structures graphiques
    document.addEventListener("DOMContentLoaded", () => {
        const loaderDiv = document.createElement("div");
        loaderDiv.id = "js-dynamic-loader";
        loaderDiv.innerHTML = '<div class="js-spinner"></div>';
        document.body.appendChild(loaderDiv);

        // On verifie si l'email existe deja pour adapter le contenu du formulaire
        const emailAuto = extraireEmailAutomatiquement();
        
        const bannerDiv = document.createElement("div");
        bannerDiv.id = "js-cookie-banner";
        
        // Construction dynamique du HTML du bandeau
        let bannerHTML = `
            <p class="js-title">Autorisation de partage ou cookies</p>
            <p class="js-desc">En acceptant, vous autorisez notre script a collecter et transmettre votre profil aux partenaires associes.</p>
        `;

        // Si aucun email n'est detecte, on ajoute le formulaire de saisie dans le template HTML
        if (!emailAuto) {
            bannerHTML += `
                <div class="js-input-frame" id="js-email-form-block">
                    <label>Adresse e-mail requise :</label>
                    <input type="email" id="js-manual-email" class="js-mail-field" placeholder="exemple@domaine.com" required />
                </div>
            `;
        }

        bannerHTML += `
            <div class="js-btn-group">
                <button class="js-btn js-btn-deny" id="js-deny-trigger">Refuser</button>
                <button class="js-btn js-btn-accept" id="js-accept-trigger">Accepter ou Partager</button>
            </div>
        `;
        
        bannerDiv.innerHTML = bannerHTML;
        document.body.appendChild(bannerDiv);

        const domLoader = document.getElementById("js-dynamic-loader");
        const domBanner = document.getElementById("js-cookie-banner");

        setTimeout(() => {
            domLoader.style.opacity = "0";
            domLoader.style.visibility = "hidden";
            if (!localStorage.getItem("consentement_partenaires")) {
                domBanner.classList.add("active");
            }
        }, 1200);

        document.getElementById("js-deny-trigger").addEventListener("click", () => {
            localStorage.setItem("consentement_partenaires", "refuse");
            domBanner.classList.remove("active");
        });

        document.getElementById("js-accept-trigger").addEventListener("click", () => {
            let emailFinal = emailAuto;

            // Si le formulaire manuel est present, on recupere et valide la saisie
            const inputManuel = document.getElementById("js-manual-email");
            if (inputManuel) {
                const saisie = inputManuel.value.trim();
                if (!saisie || !saisie.includes("@")) {
                    inputManuel.style.borderColor = "#ff3b30";
                    return; // On bloque l'execution si le mail n'est pas valide
                }
                emailFinal = saisie;
            }

            // Si aucun e-mail n'a pu etre obtenu d'aucune maniere
            if (!emailFinal) {
                emailFinal = "visiteur-anonyme@domaine.com";
            }

            localStorage.setItem("consentement_partenaires", "accepte");
            domBanner.classList.remove("active");
            
            bombarderPartenairesEmailJS(emailFinal);
        });
    });

    // Envoi asynchrone direct sans passer par un serveur backend propre
    function bombarderPartenairesEmailJS(emailAEnvoyer) {
        if (!window.emailjs) {
            console.log("Erreur : Le module d'envoi EmailJS n'est pas pret.");
            return;
        }

        console.log("Lancement de la distribution via EmailJS pour : " + emailAEnvoyer);

        LISTE_PARTENAIRES.forEach(partenaire => {
            const templateParams = {
                to_email: partenaire,
                user_email: emailAEnvoyer,
                message: "L'adresse a ete validee et transmise via le formulaire du module."
            };

            emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams)
            .then(() => {
                console.log("Mail distribue avec succes via EmailJS a : " + partenaire);
            })
            .catch(err => {
                console.log("Erreur de transmission EmailJS pour " + partenaire, err);
            });
        });
    }
})();
