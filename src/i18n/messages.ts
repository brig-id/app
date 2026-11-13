/**
 * Every text of the interface, in English and in French. No component holds
 * a text of its own: a page is not done until both columns are written
 * (`messages.spec.ts` checks it).
 *
 * `{name}` is replaced by a parameter; `**words**` are set in bold. French is
 * written with plain spaces before `:`, `?`, `!` and inside `« »`; they are
 * made non-breaking when the table is read (`index.tsx`).
 */
export const MESSAGES = {
  // -- shared ----------------------------------------------------------------
  "common.cancel": ["Cancel", "Annuler"],
  "common.save": ["Save", "Enregistrer"],
  "common.saved": ["Saved.", "Enregistré."],
  "common.continue": ["Continue", "Continuer"],
  "common.loading": ["Loading…", "Chargement…"],
  "common.optional": ["(optional)", "(facultatif)"],
  "common.waiting-passkey": [
    "Waiting for your passkey…",
    "En attente de votre clé d’accès…",
  ],
  "common.new-tab": ["(opens in a new tab)", "(s’ouvre dans un nouvel onglet)"],
  "common.skip": ["Skip to the content", "Aller au contenu"],

  "error.network": [
    "The server can’t be reached. Try again.",
    "Le serveur est injoignable. Réessayez.",
  ],
  "error.unexpected": [
    "Something went wrong. Try again.",
    "Une erreur est survenue. Réessayez.",
  ],
  "error.rate": [
    "Too many attempts. Wait a minute and try again.",
    "Trop de tentatives. Patientez une minute, puis réessayez.",
  ],
  "error.server-said": ["The server answered:", "Le serveur a répondu :"],

  "language.switch": ["Français", "English"],

  // -- document titles ---------------------------------------------------------
  "title.signin": ["Sign in", "Se connecter"],
  "title.signup": ["Create an account", "Créer un compte"],
  "title.recover": ["Recover your account", "Récupérer votre compte"],
  "title.continue": [
    "Continue to an application",
    "Continuer vers une application",
  ],
  "title.about": ["About", "À propos"],
  "title.welcome": ["Welcome", "Bienvenue"],
  "title.identities": ["Identities", "Identités"],
  "title.passkeys": ["Passkeys", "Clés d’accès"],

  // -- sign-in -----------------------------------------------------------------
  "signin.title": ["Sign in", "Se connecter"],
  "signin.on": ["on **{server}**", "sur **{server}**"],
  "signin.other-server": ["Another server", "Un autre serveur"],
  "signin.server.label": ["Server", "Serveur"],
  "signin.server.hint": [
    "The domain of a brig·id server, like id.example.org",
    "Le domaine d’un serveur brig·id, par exemple id.example.org",
  ],
  "signin.server.invalid": [
    "Enter a server’s domain, like id.example.org",
    "Saisissez le domaine d’un serveur, par exemple id.example.org",
  ],
  "signin.button": ["Use my passkey", "Utiliser ma clé d’accès"],
  "signin.no-passkey": [
    "No passkey was used. Try again, or use another device.",
    "Aucune clé d’accès n’a été utilisée. Réessayez, ou utilisez un autre appareil.",
  ],
  "signin.create": ["Create an account", "Créer un compte"],
  "signin.lost": ["Lost your passkeys?", "Clés d’accès perdues ?"],
  "signin.closed": [
    "This server does not accept new accounts.",
    "Ce serveur n’accepte pas de nouveaux comptes.",
  ],

  // -- sign-up -----------------------------------------------------------------
  "signup.title": ["Create an account", "Créer un compte"],
  "signup.lead": [
    "Your account is a **passkey**: no password, no username. Your device or your password manager keeps it, and unlocks it with your fingerprint, your face or a PIN.",
    "Votre compte, c’est une **clé d’accès** : ni mot de passe, ni nom d’utilisateur. Votre appareil ou votre gestionnaire de mots de passe la conserve, et la déverrouille avec votre empreinte, votre visage ou un code.",
  ],
  "signup.then": [
    "You then create the identities that applications will see. They never see your account.",
    "Vous créez ensuite les identités que verront les applications. Elles ne voient jamais votre compte.",
  ],
  "signup.button": ["Create my account", "Créer mon compte"],
  "signup.none-created": [
    "No passkey was created, so no account either. Try again.",
    "Aucune clé d’accès n’a été créée, donc aucun compte non plus. Réessayez.",
  ],
  "signup.have-account": [
    "Already have an account? Sign in",
    "Déjà un compte ? Se connecter",
  ],
  "signup.closed": [
    "This server does not accept new accounts. If you already have one, sign in.",
    "Ce serveur n’accepte pas de nouveaux comptes. Si vous en avez déjà un, connectez-vous.",
  ],

  // -- recovery ----------------------------------------------------------------
  "recover.title": ["Recover your account", "Récupérer votre compte"],
  "recover.lead": [
    "Lost every passkey? Enter the recovery code you kept when you created your account. You will then create a new passkey on this device.",
    "Vous avez perdu toutes vos clés d’accès ? Saisissez le code de récupération conservé à la création de votre compte. Vous créerez ensuite une nouvelle clé d’accès sur cet appareil.",
  ],
  "recover.code.label": ["Recovery code", "Code de récupération"],
  "recover.code.hint": [
    "40 letters and digits, in groups of four",
    "40 lettres et chiffres, par groupes de quatre",
  ],
  "recover.button": ["Recover", "Récupérer"],
  "recover.shape": [
    "A recovery code has 40 characters. Check what you typed.",
    "Un code de récupération compte 40 caractères. Vérifiez votre saisie.",
  ],
  "recover.none-created": [
    "No passkey was created. Your code is still valid: try again.",
    "Aucune clé d’accès n’a été créée. Votre code reste valable : réessayez.",
  ],
  "recover.unknown": [
    "This code opens no account on this server.",
    "Ce code n’ouvre aucun compte sur ce serveur.",
  ],
  "recover.back": ["Back to sign-in", "Retour à la connexion"],

  // -- a browser without passkeys ---------------------------------------------
  "unsupported.insecure": [
    "Passkeys only work on secure pages. Open this page with **https://** in its address.",
    "Les clés d’accès ne fonctionnent que sur des pages sécurisées. Ouvrez cette page avec **https://** dans son adresse.",
  ],
  "unsupported.browser": [
    "This browser can’t use passkeys. Update it, or use a recent Chrome, Safari, Edge or Firefox.",
    "Ce navigateur ne sait pas utiliser les clés d’accès. Mettez-le à jour, ou utilisez une version récente de Chrome, Safari, Edge ou Firefox.",
  ],
  "unsupported.why": [
    "brig·id signs you in with passkeys only: no password to remember or to steal. A passkey can live on this device, on your phone, or on a security key.",
    "brig·id vous connecte uniquement avec des clés d’accès : aucun mot de passe à retenir ni à voler. Une clé d’accès peut se trouver sur cet appareil, sur votre téléphone ou sur une clé de sécurité.",
  ],
  "unsupported.learn": ["What is a passkey?", "Qu’est-ce qu’une clé d’accès ?"],

  // -- the linking page ----------------------------------------------------------
  "continue.title": ["Continue to **{app}**", "Continuer vers **{app}**"],
  "continue.request": ["Sign-in request", "Demande de connexion"],
  "continue.expired": [
    "This sign-in request has expired. Go back to the application and start again.",
    "Cette demande de connexion a expiré. Retournez à l’application et recommencez.",
  ],
  "continue.expired-close": [
    "This sign-in request has expired. You can close this page.",
    "Cette demande de connexion a expiré. Vous pouvez fermer cette page.",
  ],
  "continue.invalid": [
    "This sign-in request is not valid.",
    "Cette demande de connexion n’est pas valide.",
  ],
  "continue.unknown-client": [
    "The application that sent you here is not registered on this server.",
    "L’application qui vous envoie ici n’est pas enregistrée sur ce serveur.",
  ],
  "continue.bad-redirect": [
    "The application asked to send you back to an address it did not register.",
    "L’application a demandé à vous renvoyer vers une adresse qu’elle n’a pas enregistrée.",
  ],
  "continue.confirm": [
    "This application asks you to confirm it is you.",
    "Cette application vous demande de confirmer que c’est bien vous.",
  ],
  "continue.sign-in-first": [
    "Sign in to choose the identity this application will meet.",
    "Connectez-vous pour choisir l’identité que cette application rencontrera.",
  ],
  "continue.which": [
    "Which identity will this application meet?",
    "Quelle identité cette application rencontrera-t-elle ?",
  ],
  "continue.none": [
    "Your account has no identity yet. Create one, then start again from the application.",
    "Votre compte n’a pas encore d’identité. Créez-en une, puis recommencez depuis l’application.",
  ],
  "continue.none.link": ["Create an identity", "Créer une identité"],
  "continue.shared": [
    "{app} receives an identifier that exists for this application and this identity only. It receives neither the identity’s name nor its icon, and it cannot connect it to your other identities.",
    "{app} reçoit un identifiant qui n’existe que pour cette application et cette identité. Elle ne reçoit ni le nom ni l’icône de l’identité, et ne peut pas la relier à vos autres identités.",
  ],
  "continue.cancel": [
    "Cancel and go back to {app}",
    "Annuler et retourner à {app}",
  ],
  "continue.returning": [
    "Returning to the application…",
    "Retour à l’application…",
  ],
  "continue.failed": [
    "Unable to continue. Try again.",
    "Impossible de continuer. Réessayez.",
  ],

  // -- about -----------------------------------------------------------------
  "about.title": ["About", "À propos"],
  "about.what": [
    "This server runs brig·id, free software for signing in with passkeys. Whoever operates this server is responsible for it; the brig·id project holds no account and no data here.",
    "Ce serveur fonctionne avec brig·id, un logiciel libre de connexion par clés d’accès. La personne ou l’organisation qui l’exploite en est responsable ; le projet brig·id n’y détient ni compte ni donnée.",
  ],
  "about.licence": [
    "brig·id is published under the GNU Affero General Public License, version 3 or later. You may read, run, modify and share it.",
    "brig·id est publié sous la licence publique générale GNU Affero, version 3 ou ultérieure. Vous pouvez le lire, l’exécuter, le modifier et le partager.",
  ],
  "about.source": ["Source code", "Code source"],
  "about.credits": ["Credits", "Crédits"],
  "about.credit.background": [
    "Background image: “Prism tribeam 1”, by Kelvinsong, placed in the public domain (CC0 1.0), from Wikimedia Commons.",
    "Image de fond : « Prism tribeam 1 », par Kelvinsong, versée au domaine public (CC0 1.0), depuis Wikimedia Commons.",
  ],
  "about.credit.fonts": [
    "Typefaces: Geist and Geist Mono, by Vercel, SIL Open Font License 1.1.",
    "Polices : Geist et Geist Mono, par Vercel, licence SIL Open Font 1.1.",
  ],
  "about.credit.icons": [
    "Icons: Phosphor Icons, MIT License. Brand logos remain trademarks of their owners.",
    "Icônes : Phosphor Icons, licence MIT. Les logos de marques restent la propriété de leurs titulaires.",
  ],
  "about.nothing-external": [
    "These pages load nothing from any other server: no font, image, script or measurement from a third party.",
    "Ces pages ne chargent rien depuis un autre serveur : ni police, ni image, ni script, ni mesure d’audience d’un tiers.",
  ],
  "about.credit.file": ["See the file", "Voir le fichier"],
  "about.back": ["Back", "Retour"],

  // -- account navigation ------------------------------------------------------
  "nav.label": ["Account", "Compte"],
  "nav.identities": ["Identities", "Identités"],
  "nav.passkeys": ["Passkeys", "Clés d’accès"],
  "nav.signout": ["Sign out", "Se déconnecter"],
  "nav.about": ["About", "À propos"],

  // -- onboarding --------------------------------------------------------------
  "welcome.title": ["Welcome to brig·id", "Bienvenue sur brig·id"],
  "welcome.lead": [
    "Your account exists. Two things before you start.",
    "Votre compte existe. Deux choses avant de commencer.",
  ],
  "welcome.back.title": ["Your account is back", "Votre compte est de retour"],
  "welcome.back.lead": [
    "Your new passkey works, and your old recovery code is used up: keep the new one below.",
    "Votre nouvelle clé d’accès fonctionne, et votre ancien code de récupération est consommé : conservez le nouveau ci-dessous.",
  ],
  "welcome.passkey.title": ["Your passkey", "Votre clé d’accès"],
  "welcome.passkey.lead": [
    "A name helps you recognise it later, for instance where it is kept.",
    "Un nom vous aidera à la reconnaître plus tard, par exemple l’endroit où elle est conservée.",
  ],
  "welcome.passkey.save": ["Save the name", "Enregistrer le nom"],
  "welcome.continue": [
    "Continue to my identities",
    "Continuer vers mes identités",
  ],
  "welcome.continue.hint": [
    "Keep your recovery code first.",
    "Conservez d’abord votre code de récupération.",
  ],

  // -- recovery code panel -----------------------------------------------------
  "recovery.title": ["Recovery code", "Code de récupération"],
  "recovery.lead": [
    "If you lose every passkey, this code lets you add a new one. It is the only way back into your account: nobody can reset it for you.",
    "Si vous perdez toutes vos clés d’accès, ce code vous permet d’en ajouter une nouvelle. C’est le seul moyen de retrouver votre compte : personne ne peut le réinitialiser pour vous.",
  ],
  "recovery.once": [
    "Shown only now. Keep it somewhere safe, apart from your devices: in a password manager, or printed.",
    "Affiché une seule fois. Conservez-le en lieu sûr, à l’écart de vos appareils : dans un gestionnaire de mots de passe, ou imprimé.",
  ],
  "recovery.value": ["Your recovery code", "Votre code de récupération"],
  "recovery.copy": ["Copy", "Copier"],
  "recovery.copied": ["Copied", "Copié"],
  "recovery.download": ["Download", "Télécharger"],
  "recovery.kept": [
    "I kept my recovery code",
    "J’ai conservé mon code de récupération",
  ],
  "recovery.has": [
    "You have a recovery code, created on {date}.",
    "Vous avez un code de récupération, créé le {date}.",
  ],
  "recovery.none": [
    "You have no recovery code.",
    "Vous n’avez pas de code de récupération.",
  ],
  "recovery.last-used": [
    "Your account was last recovered on {date}.",
    "Votre compte a été récupéré pour la dernière fois le {date}.",
  ],
  "recovery.create": [
    "Create a recovery code",
    "Créer un code de récupération",
  ],
  "recovery.replace": ["Create a new code", "Créer un nouveau code"],
  "recovery.replace.confirm": [
    "Replace your recovery code? The current one will stop working.",
    "Remplacer votre code de récupération ? Le code actuel cessera de fonctionner.",
  ],
  "recovery.replace.yes": ["Replace it", "Le remplacer"],
  "recovery.file": [
    "brig·id recovery code\n\n{code}\n\nServer: {server}\n\nIf you lose every passkey of your account, open\nhttps://{server}/recover/ and enter this code to add a new passkey.\nIt works once; you will then get a new one.\nAnyone with this code can add a passkey to your account: keep it private.\n",
    "Code de récupération brig·id\n\n{code}\n\nServeur : {server}\n\nSi vous perdez toutes les clés d’accès de votre compte, ouvrez\nhttps://{server}/recover/ et saisissez ce code pour ajouter une nouvelle clé d’accès.\nIl ne sert qu’une fois ; vous en recevrez alors un nouveau.\nQuiconque détient ce code peut ajouter une clé d’accès à votre compte : gardez-le secret.\n",
  ],

  // -- identities --------------------------------------------------------------
  "identities.title": ["Identities", "Identités"],
  "identities.lead": [
    "What each application sees of you. Applications never see your account, and two identities can’t be connected to each other.",
    "Ce que chaque application voit de vous. Les applications ne voient jamais votre compte, et deux identités ne peuvent pas être reliées entre elles.",
  ],
  "identities.new": ["New identity", "Nouvelle identité"],
  "identities.empty": [
    "No identity yet. Create one to sign in to applications.",
    "Aucune identité pour l’instant. Créez-en une pour vous connecter à des applications.",
  ],
  "identity.form.edit": ["Edit “{name}”", "Modifier « {name} »"],
  "identity.form.template": ["Start from", "Partir de"],
  "identity.form.template.hint": [
    "A starting point: it fills the fields below, and you can change everything.",
    "Un point de départ : il remplit les champs ci-dessous, et vous pouvez tout modifier.",
  ],
  "identity.form.name": ["Name", "Nom"],
  "identity.form.name.hint": [
    "Only you see it. No application receives it.",
    "Vous seul le voyez. Aucune application ne le reçoit.",
  ],
  "identity.form.description": ["Description", "Description"],
  "identity.form.logo": ["Icon", "Icône"],
  "identity.create": ["Create", "Créer"],
  "identity.created": ["“{name}” created.", "« {name} » créée."],
  "identity.saved": ["Identity saved.", "Identité enregistrée."],
  "identity.deleted": ["“{name}” deleted.", "« {name} » supprimée."],
  "identity.edit": ["Edit", "Modifier"],
  "identity.delete": ["Delete", "Supprimer"],
  "identity.delete.confirm": [
    "Delete “{name}”? This cannot be undone.",
    "Supprimer « {name} » ? Cette action est définitive.",
  ],
  "identity.delete.yes": ["Yes, delete", "Oui, supprimer"],

  "template.personal": ["Personal", "Personnelle"],
  "template.personal.about": [
    "Kept strictly for yourself.",
    "Strictement pour vous.",
  ],
  "template.work": ["Work", "Travail"],
  "template.work.about": [
    "Work accounts and tools.",
    "Comptes et outils de travail.",
  ],
  "template.developer": ["Developer", "Développement"],
  "template.developer.about": [
    "Developer tooling.",
    "Outils de développement.",
  ],
  "template.creative": ["Creative", "Création"],
  "template.creative.about": [
    "Creative tools and communities.",
    "Outils et communautés de création.",
  ],
  "template.family": ["Family", "Famille"],
  "template.family.about": [
    "Shared within a restricted circle.",
    "Partagée dans un cercle restreint.",
  ],
  "template.public": ["Public", "Publique"],
  "template.public.about": ["Visible to everyone.", "Visible de tous."],
  "template.isolated": ["Isolated", "Isolée"],
  "template.isolated.about": [
    "Unlinked from everything else.",
    "Sans lien avec tout le reste.",
  ],

  "icons.group.people": ["People", "Personnes"],
  "icons.group.work": ["Work and study", "Travail et études"],
  "icons.group.hobbies": ["Hobbies", "Loisirs"],
  "icons.group.things": ["Places and things", "Lieux et objets"],
  "icons.group.brands": ["Brands", "Marques"],

  "icon.user": ["Person", "Personne"],
  "icon.user-circle-gear": ["Professional", "Professionnel"],
  "icon.rocket-launch": ["Rocket", "Fusée"],
  "icon.sword": ["Sword", "Épée"],
  "icon.detective": ["Incognito", "Incognito"],
  "icon.mask-happy": ["Mask", "Masque"],
  "icon.ghost": ["Ghost", "Fantôme"],
  "icon.house-line": ["Family", "Famille"],
  "icon.baby": ["Children", "Enfants"],
  "icon.users-three": ["Group", "Groupe"],
  "icon.briefcase": ["Briefcase", "Mallette"],
  "icon.buildings": ["Office", "Bureau"],
  "icon.bank": ["Institution", "Institution"],
  "icon.graduation-cap": ["Studies", "Études"],
  "icon.book-open": ["Book", "Livre"],
  "icon.flask": ["Lab", "Laboratoire"],
  "icon.code": ["Code", "Code"],
  "icon.terminal-window": ["Terminal", "Terminal"],
  "icon.laptop": ["Laptop", "Ordinateur portable"],
  "icon.hard-drives": ["Server", "Serveur"],
  "icon.palette": ["Palette", "Palette"],
  "icon.camera": ["Camera", "Appareil photo"],
  "icon.music-notes": ["Music", "Musique"],
  "icon.game-controller": ["Games", "Jeux"],
  "icon.soccer-ball": ["Sport", "Sport"],
  "icon.bicycle": ["Cycling", "Vélo"],
  "icon.mountains": ["Mountains", "Montagnes"],
  "icon.airplane-tilt": ["Travel", "Voyage"],
  "icon.coffee": ["Coffee", "Café"],
  "icon.horse": ["Horse", "Cheval"],
  "icon.house": ["Home", "Maison"],
  "icon.globe-hemisphere-west": ["World", "Monde"],
  "icon.shopping-cart": ["Shopping", "Achats"],
  "icon.heart": ["Heart", "Cœur"],
  "icon.star": ["Star", "Étoile"],
  "icon.lightning": ["Lightning", "Éclair"],
  "icon.leaf": ["Leaf", "Feuille"],
  "icon.feather": ["Feather", "Plume"],
  "icon.diamond": ["Diamond", "Diamant"],
  "icon.shield-check": ["Shield", "Bouclier"],
  "icon.github-logo": ["GitHub", "GitHub"],
  "icon.gitlab-logo": ["GitLab", "GitLab"],
  "icon.discord-logo": ["Discord", "Discord"],
  "icon.mastodon-logo": ["Mastodon", "Mastodon"],
  "icon.linkedin-logo": ["LinkedIn", "LinkedIn"],
  "icon.unknown": ["Icon", "Icône"],

  // -- passkeys ----------------------------------------------------------------
  "passkeys.title": ["Your passkeys", "Vos clés d’accès"],
  "passkeys.lead": [
    "What unlocks your account. Name them to tell them apart.",
    "Ce qui déverrouille votre compte. Nommez-les pour les distinguer.",
  ],
  "passkeys.add": ["Add a passkey", "Ajouter une clé d’accès"],
  "passkeys.added": ["Passkey added.", "Clé d’accès ajoutée."],
  "passkeys.removed": ["Passkey removed.", "Clé d’accès retirée."],
  "passkeys.renamed": ["Passkey renamed.", "Clé d’accès renommée."],
  "passkeys.load-failed": [
    "Unable to load your passkeys.",
    "Impossible de charger vos clés d’accès.",
  ],
  "passkeys.add-failed": [
    "No passkey was added.",
    "Aucune clé d’accès n’a été ajoutée.",
  ],
  "passkeys.remove-failed": [
    "The passkey was not removed.",
    "La clé d’accès n’a pas été retirée.",
  ],
  "passkeys.rename-failed": [
    "The passkey was not renamed.",
    "La clé d’accès n’a pas été renommée.",
  ],
  "passkey.unnamed": ["Passkey {id}", "Clé d’accès {id}"],
  "passkey.name": ["Name", "Nom"],
  "passkey.name.hint": [
    "For example: Pixel 9, 1Password, YubiKey",
    "Par exemple : Pixel 9, 1Password, YubiKey",
  ],
  "passkey.rename": ["Rename", "Renommer"],
  "passkey.remove": ["Remove", "Retirer"],
  "passkey.only": [
    "Your only passkey: add another before removing this one.",
    "Votre seule clé d’accès : ajoutez-en une autre avant de retirer celle-ci.",
  ],
} as const satisfies Record<string, readonly [en: string, fr: string]>;

export type MessageId = keyof typeof MESSAGES;
