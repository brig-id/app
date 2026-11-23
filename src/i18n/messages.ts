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
  "error.suspended": [
    "This account is suspended by an administrator of this server.",
    "Ce compte est suspendu par un administrateur de ce serveur.",
  ],
  "error.link-invalid": [
    "This link is not valid any more: it was used, it expired, or it was revoked.",
    "Ce lien n’est plus valable : il a été utilisé, il a expiré ou il a été révoqué.",
  ],

  "theme.light": ["Light theme", "Thème clair"],
  "theme.dark": ["Dark theme", "Thème sombre"],

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
  "title.identity": ["Identity", "Identité"],
  "title.compare": ["Compare identities", "Comparer les identités"],
  "title.account": ["Account", "Compte"],
  "title.setup": ["Set up this server", "Mettre en place ce serveur"],
  "title.claim": ["Become an administrator", "Devenir administrateur"],
  "title.admin": ["Administration", "Administration"],
  "title.passkeys": ["Passkeys", "Clés d’accès"],

  // -- sign-in -----------------------------------------------------------------
  "signin.title": ["Sign in", "Se connecter"],
  "signin.deleted": [
    "Your account and everything about it were deleted from this server.",
    "Votre compte et tout ce qui le concernait ont été supprimés de ce serveur.",
  ],
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
  "signup.invitation": [
    "This server takes new accounts by invitation. Ask its administrator for an invitation link.",
    "Ce serveur n’accepte de nouveaux comptes que sur invitation. Demandez un lien d’invitation à son administrateur.",
  ],
  "signup.invited": [
    "You were invited to this server.",
    "Vous êtes invité sur ce serveur.",
  ],

  // -- the first administrator -------------------------------------------------
  "setup.title": ["Set up this server", "Mettre en place ce serveur"],
  "setup.lead": [
    "This link creates the first account of **{server}**. That account will administer the server.",
    "Ce lien crée le premier compte de **{server}**. Ce compte administrera le serveur.",
  ],
  "setup.then": [
    "Like any account, it is a passkey and nothing else. Administering a server shows nobody’s identities, not even to you.",
    "Comme tout compte, c’est une clé d’accès et rien d’autre. Administrer un serveur ne montre les identités de personne, pas même à vous.",
  ],
  "setup.button": [
    "Create the administrator’s account",
    "Créer le compte de l’administrateur",
  ],
  "setup.no-link": [
    "This page is opened from the link a new server prints when it starts.",
    "Cette page s’ouvre depuis le lien qu’un nouveau serveur affiche à son démarrage.",
  ],
  "setup.invalid": [
    "This setup link is not valid any more: it works once, for an hour, and a newer one replaces it. On the server’s machine, **seedling admin link** prints a new one. If the server already has an administrator, sign in.",
    "Ce lien de mise en place n’est plus valable : il sert une fois, pendant une heure, et un lien plus récent le remplace. Sur la machine du serveur, **seedling admin link** en affiche un nouveau. Si le serveur a déjà un administrateur, connectez-vous.",
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
  "continue.declared": [
    "It calls itself “{name}”: only the address above is checked.",
    "Il se présente comme « {name} » : seule l’adresse ci-dessus est vérifiée.",
  ],
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
  "continue.asks": ["{app} asks for", "{app} demande"],
  "continue.asks.hint": [
    "Tick what you accept to share with it. Nothing is ticked for you.",
    "Cochez ce que vous acceptez de lui partager. Rien n’est coché à votre place.",
  ],
  "continue.required": ["Required", "Requis"],
  "continue.optional": ["Optional", "Facultatif"],
  "continue.accepted-before": [
    "You accepted this before.",
    "Vous l’avez déjà accepté.",
  ],
  "continue.refused-before": [
    "You refused this before.",
    "Vous l’avez déjà refusé.",
  ],
  "continue.missing": ["This identity has none.", "Cette identité n’en a pas."],
  "continue.add.label": [
    "{attribute} of this identity",
    "{attribute} de cette identité",
  ],
  "continue.add": ["Add to this identity", "Ajouter à cette identité"],
  "continue.add.hint": [
    "A value you add is saved on this identity. It is sent only if you then tick it.",
    "Une valeur ajoutée est enregistrée sur cette identité. Elle n’est envoyée que si vous la cochez ensuite.",
  ],
  "continue.add.failed": [
    "This value was not accepted. Check it and try again.",
    "Cette valeur n’a pas été acceptée. Vérifiez-la, puis réessayez.",
  ],
  "continue.blocked": [
    "{app} does not work without what is marked “Required”. Accept it, choose another identity, or go back.",
    "{app} ne fonctionne pas sans ce qui est marqué « Requis ». Acceptez-le, choisissez une autre identité, ou revenez en arrière.",
  ],
  "continue.shared.attributes": [
    "{app} receives an identifier that exists for this application and this identity only, and what you tick, with the values shown. It never receives the identity’s name, icon or description.",
    "{app} reçoit un identifiant qui n’existe que pour cette application et cette identité, et ce que vous cochez, avec les valeurs affichées. Elle ne reçoit jamais le nom, l’icône ni la description de l’identité.",
  ],
  "continue.setup": [
    "Your account is not ready yet: it needs its recovery code. Finish setting it up, then start again from the application.",
    "Votre compte n’est pas encore prêt : il lui faut son code de récupération. Terminez sa mise en place, puis recommencez depuis l’application.",
  ],
  "continue.setup.link": [
    "Finish setting up my account",
    "Terminer la mise en place de mon compte",
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
  "about.version": ["What runs here:", "Ce qui tourne ici :"],
  "about.credits": ["Credits", "Crédits"],
  "about.credit.background": [
    "Background images: “Prism tribeam 1”, by Kelvinsong, and “Dingle cliff”, by Ian Schneider, both placed in the public domain (CC0 1.0), from Wikimedia Commons.",
    "Images de fond : « Prism tribeam 1 », par Kelvinsong, et « Dingle cliff », par Ian Schneider, toutes deux versées au domaine public (CC0 1.0), depuis Wikimedia Commons.",
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
  "about.credit.file": ["The prism", "Le prisme"],
  "about.credit.file-light": ["The cliff", "La falaise"],
  "about.back": ["Back", "Retour"],

  // -- account navigation ------------------------------------------------------
  "nav.label": ["Account", "Compte"],
  "nav.identities": ["Identities", "Identités"],
  "nav.passkeys": ["Passkeys", "Clés d’accès"],
  "nav.account": ["Account", "Compte"],
  "nav.admin": ["Administration", "Administration"],
  "nav.to-account": ["My account", "Mon compte"],
  "nav.identities.compare": ["Compare", "Comparer"],
  "nav.identities.new": ["New identity", "Nouvelle identité"],
  "nav.account.export": ["Your data", "Vos données"],
  "nav.account.delete": ["Delete the account", "Supprimer le compte"],
  "nav.signout": ["Sign out", "Se déconnecter"],
  "nav.signout.failed": [
    "You are still signed in: the server could not be told. Try again.",
    "Vous êtes toujours connecté : le serveur n’a pas pu être prévenu. Réessayez.",
  ],
  "version.running": [
    "{edition} {version} · interface {interface}",
    "{edition} {version} · interface {interface}",
  ],
  "version.interface": ["interface {interface}", "interface {interface}"],
  "nav.about": ["About", "À propos"],

  // -- onboarding --------------------------------------------------------------
  "welcome.title": ["Welcome to brig·id", "Bienvenue sur brig·id"],
  "welcome.lead": [
    "Your account exists. A few things before you start.",
    "Votre compte existe. Quelques réglages avant de commencer.",
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
  "welcome.identities.title": [
    "Your first identities",
    "Vos premières identités",
  ],
  "welcome.identities.lead": [
    "An identity is what an application meets in your place. Keep the ones that suit you, rename them or untick them: you can create others at any time.",
    "Une identité est ce qu’une application rencontre à votre place. Gardez celles qui vous conviennent, renommez-les ou décochez-les : vous pourrez en créer d’autres à tout moment.",
  ],
  "welcome.identities.keep": ["Create “{name}”", "Créer « {name} »"],
  "welcome.identities.failed": [
    "Not every identity could be created. Try again: the ones that exist are not created twice.",
    "Toutes les identités n’ont pas pu être créées. Réessayez : celles qui existent ne sont pas créées deux fois.",
  ],
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

  // -- the account: export, deletion ---------------------------------------------
  "account.title": ["Your account", "Votre compte"],
  "account.lead": [
    "Your account is your private way in: passkeys and a recovery code. It holds nothing that describes you, and no application ever sees it.",
    "Votre compte est votre entrée privée : des clés d’accès et un code de récupération. Il ne contient rien qui vous décrive, et aucune application ne le voit.",
  ],
  "account.export.title": ["Export your data", "Exporter vos données"],
  "account.export.lead": [
    "A file with your identities, their names and their information, and the applications each one signed in to. It is made here, in your browser, and anyone can read it: keep it somewhere private.",
    "Un fichier avec vos identités, leurs noms et leurs informations, ainsi que les applications auxquelles chacune s’est connectée. Il est produit ici, dans votre navigateur, et n’importe qui peut le lire : rangez-le dans un endroit privé.",
  ],
  "account.export.button": ["Download my data", "Télécharger mes données"],
  "account.export.done": ["Downloaded: {file}", "Téléchargé : {file}"],
  "account.export.failed": [
    "The export could not be made. Try again.",
    "L’export n’a pas pu être produit. Réessayez.",
  ],
  "account.delete.title": ["Delete your account", "Supprimer votre compte"],
  "account.delete.removes": [
    "This removes from this server, for good: your account, your passkeys and your recovery code, every identity with its information, and what was recorded about the applications they signed in to.",
    "Cela retire de ce serveur, définitivement : votre compte, vos clés d’accès et votre code de récupération, chaque identité avec ses informations, et ce qui a été enregistré sur les applications auxquelles elles se sont connectées.",
  ],
  "account.delete.keeps": [
    "It cannot reach the applications: each one keeps what it received, and the account you have there. Nobody can restore a deleted account, not even the administrator of this server.",
    "Cela n’atteint pas les applications : chacune conserve ce qu’elle a reçu, et le compte que vous y avez. Personne ne peut restaurer un compte supprimé, pas même l’administrateur de ce serveur.",
  ],
  "account.delete.passkey": [
    "The passkey kept by your password manager is not removed by this page: delete it there afterwards.",
    "La clé d’accès conservée par votre gestionnaire de mots de passe n’est pas retirée par cette page : supprimez-la ensuite dans ce gestionnaire.",
  ],
  "account.delete.understood": [
    "I understand that this cannot be undone",
    "Je comprends que c’est définitif",
  ],
  "account.delete.button": [
    "Delete my account with my passkey",
    "Supprimer mon compte avec ma clé d’accès",
  ],
  "account.delete.cancelled": [
    "Nothing was deleted: the passkey was not used.",
    "Rien n’a été supprimé : la clé d’accès n’a pas été utilisée.",
  ],
  "account.delete.failed": [
    "The account was not deleted. Try again.",
    "Le compte n’a pas été supprimé. Réessayez.",
  ],

  // -- administration -----------------------------------------------------------
  "claim.title": ["Become an administrator", "Devenir administrateur"],
  "claim.lead": [
    "This link was made on the server’s machine. Opening it makes **your account** an administrator of this server.",
    "Ce lien a été créé sur la machine du serveur. L’ouvrir fait de **votre compte** un administrateur de ce serveur.",
  ],
  "claim.button": ["Become an administrator", "Devenir administrateur"],
  "claim.done": [
    "Your account now administers this server.",
    "Votre compte administre maintenant ce serveur.",
  ],
  "claim.no-link": [
    "This page is opened from the address a command prints on the server’s machine.",
    "Cette page s’ouvre depuis l’adresse qu’une commande affiche sur la machine du serveur.",
  ],
  "claim.go": ["Open the administration", "Ouvrir l’administration"],

  "admin.not-admin": [
    "This part is for the administrators of this server.",
    "Cette partie est réservée aux administrateurs de ce serveur.",
  ],
  "admin.tabs.label": ["Administration", "Administration"],
  "admin.tab.accounts": ["Accounts", "Comptes"],
  "admin.tab.applications": ["Applications", "Applications"],
  "admin.tab.signup": ["Sign-up", "Inscription"],
  "admin.tab.websites": ["Websites", "Sites web"],
  "admin.websites.title": [
    "Websites with no registration",
    "Sites sans inscription",
  ],
  "admin.websites.lead": [
    "A website can describe itself in a document on its own domain: it then signs in the people of any server that accepts it, without being registered. People always see its address before its name.",
    "Un site peut se décrire dans un document sur son propre domaine : il connecte alors les personnes de tout serveur qui l’accepte, sans y être inscrit. Les personnes voient toujours son adresse avant son nom.",
  ],
  "admin.websites.which": [
    "Which of them this server accepts",
    "Lesquels ce serveur accepte",
  ],
  "admin.websites.open": ["Any", "Tous"],
  "admin.websites.open.about": [
    "Every website that describes itself, except the ones you refuse. Each person decides where they sign in.",
    "Tout site qui se décrit, sauf ceux que vous refusez. Chaque personne décide où elle se connecte.",
  ],
  "admin.websites.listed": [
    "Only the accepted ones",
    "Seulement ceux acceptés",
  ],
  "admin.websites.listed.about": [
    "Only the websites you accept below: for a server whose people use a known set of applications.",
    "Seulement les sites acceptés ci-dessous : pour un serveur dont les personnes utilisent des applications connues.",
  ],
  "admin.websites.registered": ["None", "Aucun"],
  "admin.websites.registered.about": [
    "Only the applications registered on this server.",
    "Seulement les applications inscrites sur ce serveur.",
  ],
  "admin.websites.cap": [
    "What they may ask for, at most",
    "Ce qu’ils peuvent demander, au plus",
  ],
  "admin.websites.cap.lead": [
    "Whatever its document says, such a website may ask only for these. People still decide, one by one.",
    "Quoi que dise son document, un tel site ne peut demander que ceux-ci. Les personnes décident toujours, un par un.",
  ],
  "admin.websites.lists": ["Accepted and refused", "Acceptés et refusés"],
  "admin.websites.lists.lead": [
    "A website is named by the address of its document. An accepted website is also the only kind whose logo may be shown.",
    "Un site se désigne par l’adresse de son document. Seul un site accepté peut aussi avoir son logo affiché.",
  ],
  "admin.websites.address": [
    "Address of its document",
    "Adresse de son document",
  ],
  "admin.websites.address.hint": [
    "Its https address, which most websites end with /oauth-client-metadata.json.",
    "Son adresse https, qui se termine le plus souvent par /oauth-client-metadata.json.",
  ],
  "admin.websites.accept": ["Accept", "Accepter"],
  "admin.websites.refuse": ["Refuse", "Refuser"],
  "admin.websites.accepted": ["Accepted", "Acceptés"],
  "admin.websites.refused": ["Refused", "Refusés"],
  "admin.websites.empty": ["None.", "Aucun."],
  "admin.websites.unlist": ["Take off the list", "Retirer de la liste"],
  "admin.websites.accepted.done": ["Website accepted.", "Site accepté."],
  "admin.websites.refused.done": ["Website refused.", "Site refusé."],
  "admin.websites.unlisted": [
    "Website taken off the list.",
    "Site retiré de la liste.",
  ],
  "admin.tab.log": ["Log", "Journal"],
  "admin.confirm.hint": [
    "A change asks for your passkey again when you have not used it for a few minutes.",
    "Une modification redemande votre clé d’accès si vous ne l’avez pas utilisée depuis quelques minutes.",
  ],
  "admin.confirm.cancelled": [
    "Nothing was changed: the passkey was not used.",
    "Rien n’a été modifié : la clé d’accès n’a pas été utilisée.",
  ],
  "admin.failed": [
    "The change was not made.",
    "La modification n’a pas été faite.",
  ],

  "admin.accounts.title": ["Accounts", "Comptes"],
  "admin.accounts.lead": [
    "The accounts of this server. You see that they exist, never what they hold: no identity, no name, no application.",
    "Les comptes de ce serveur. Vous voyez qu’ils existent, jamais ce qu’ils contiennent : aucune identité, aucun nom, aucune application.",
  ],
  "admin.accounts.no-reset": [
    "You cannot give access back to an account: someone who lost every passkey and their recovery code has lost it.",
    "Vous ne pouvez pas redonner l’accès à un compte : qui a perdu toutes ses clés d’accès et son code de récupération l’a perdu.",
  ],
  "admin.account.created": ["Created on {date}", "Créé le {date}"],
  "admin.account.last": [
    "Last sign-in on {date}",
    "Dernière connexion le {date}",
  ],
  "admin.account.never": [
    "No sign-in recorded",
    "Aucune connexion enregistrée",
  ],
  "admin.account.passkeys": ["Passkeys: {count}", "Clés d’accès : {count}"],
  "admin.account.recovery.yes": [
    "Has a recovery code",
    "A un code de récupération",
  ],
  "admin.account.recovery.no": [
    "No recovery code",
    "Pas de code de récupération",
  ],
  "admin.account.you": ["You", "Vous"],
  "admin.account.admin": ["Administrator", "Administrateur"],
  "admin.account.suspended": ["Suspended", "Suspendu"],
  "admin.account.suspend": ["Suspend", "Suspendre"],
  "admin.account.unsuspend": ["Lift the suspension", "Lever la suspension"],
  "admin.account.grant": ["Make administrator", "Nommer administrateur"],
  "admin.account.withdraw": ["Withdraw the role", "Retirer le rôle"],
  "admin.account.delete": ["Delete", "Supprimer"],
  "admin.account.suspend.confirm": [
    "Suspend **{name}**? Its sessions end now, and it can no longer sign in, here or to any application, until you lift the suspension. Nothing of it is deleted.",
    "Suspendre **{name}** ? Ses sessions se terminent maintenant, et il ne peut plus se connecter, ni ici ni à une application, tant que vous ne levez pas la suspension. Rien n’est supprimé.",
  ],
  "admin.account.suspend.yes": ["Yes, suspend", "Oui, suspendre"],
  "admin.account.delete.confirm": [
    "Delete **{name}**? The account, its passkeys, its identities and what was recorded about the applications they signed in to are removed for good. Nobody can restore it, and applications keep what they received.",
    "Supprimer **{name}** ? Le compte, ses clés d’accès, ses identités et ce qui a été enregistré sur les applications auxquelles elles se sont connectées sont retirés définitivement. Personne ne peut le restaurer, et les applications conservent ce qu’elles ont reçu.",
  ],
  "admin.account.delete.yes": ["Yes, delete", "Oui, supprimer"],
  "admin.account.suspended.done": [
    "{name} is suspended.",
    "{name} est suspendu.",
  ],
  "admin.account.unsuspended.done": [
    "{name} can sign in again.",
    "{name} peut de nouveau se connecter.",
  ],
  "admin.account.granted": [
    "{name} is now an administrator.",
    "{name} est maintenant administrateur.",
  ],
  "admin.account.withdrawn": [
    "{name} is no longer an administrator.",
    "{name} n’est plus administrateur.",
  ],
  "admin.account.deleted": [
    "The account was deleted.",
    "Le compte a été supprimé.",
  ],

  "admin.apps.title": ["Applications", "Applications"],
  "admin.apps.lead": [
    "The applications that may ask this server to sign people in.",
    "Les applications qui peuvent demander à ce serveur de connecter des personnes.",
  ],
  "admin.apps.none": [
    "No application is registered.",
    "Aucune application n’est enregistrée.",
  ],
  "admin.apps.new": ["Register an application", "Enregistrer une application"],
  "admin.app.name": ["Name", "Nom"],
  "admin.app.name.hint": [
    "Shown to people when they sign in to it.",
    "Montré aux personnes quand elles s’y connectent.",
  ],
  "admin.app.uris": ["Return addresses", "Adresses de retour"],
  "admin.app.uris.hint": [
    "Where the application may send people back, one per line, compared exactly. Only https, except http on localhost for development.",
    "Où l’application peut renvoyer les personnes, une par ligne, comparées exactement. Seulement https, sauf http sur localhost pour le développement.",
  ],
  "admin.app.confidential": [
    "It can keep a secret (it has a server)",
    "Elle peut garder un secret (elle a un serveur)",
  ],
  "admin.app.confidential.hint": [
    "Untick for an application that runs entirely in a browser or on a phone.",
    "Décochez pour une application qui tourne entièrement dans un navigateur ou sur un téléphone.",
  ],
  "admin.app.attributes": [
    "What it may ask people to share",
    "Ce qu’elle peut demander de partager",
  ],
  "admin.app.attributes.hint": [
    "Each person still decides, value by value. “Required” stops the sign-in of someone who refuses.",
    "Chaque personne décide quand même, valeur par valeur. « Requis » arrête la connexion de qui refuse.",
  ],
  "admin.app.need.ask": ["May ask", "Peut demander"],
  "admin.app.need.optional": ["Optional", "Facultatif"],
  "admin.app.need.required": ["Required", "Requis"],
  "admin.app.register": ["Register", "Enregistrer"],
  "admin.app.registered": [
    "“{name}” is registered. Copy what follows into its configuration.",
    "« {name} » est enregistrée. Copiez ce qui suit dans sa configuration.",
  ],
  "admin.app.client-id": ["Identifier (client_id)", "Identifiant (client_id)"],
  "admin.app.secret": ["Secret (client_secret)", "Secret (client_secret)"],
  "admin.app.secret.once": [
    "Shown only now: the server keeps a hash of it.",
    "Affiché seulement maintenant : le serveur n’en garde qu’une empreinte.",
  ],
  "admin.app.described": [
    "Describes itself as “{name}”: nobody registered it.",
    "Se présente comme « {name} » : personne ne l’a inscrite.",
  ],
  "admin.app.signs": [
    "Proves who it is with a key it publishes.",
    "Prouve qui elle est avec une clé qu’elle publie.",
  ],
  "admin.app.public": [
    "No secret: it runs in a browser or on a phone.",
    "Sans secret : elle tourne dans un navigateur ou sur un téléphone.",
  ],
  "admin.app.has-secret": ["It has a secret.", "Elle a un secret."],
  "admin.app.asks.nothing": [
    "It receives an identifier, and may ask for nothing else.",
    "Elle reçoit un identifiant, et ne peut rien demander d’autre.",
  ],
  "admin.app.asks": ["It may ask for:", "Elle peut demander :"],
  "admin.app.edit": [
    "Change what it may ask",
    "Modifier ce qu’elle peut demander",
  ],
  "admin.app.saved": [
    "Saved. What was taken away is no longer sent.",
    "Enregistré. Ce qui a été retiré n’est plus envoyé.",
  ],
  "admin.app.remove": ["Remove", "Retirer"],
  "admin.app.remove.confirm": [
    "Remove **{name}**? Nobody will sign in to it through this server any more, and what was recorded about it is deleted.",
    "Retirer **{name}** ? Plus personne ne s’y connectera par ce serveur, et ce qui a été enregistré à son sujet est supprimé.",
  ],
  "admin.app.remove.yes": ["Yes, remove", "Oui, retirer"],
  "admin.app.removed": ["“{name}” was removed.", "« {name} » a été retirée."],

  "admin.signup.title": [
    "Who may create an account",
    "Qui peut créer un compte",
  ],
  "admin.signup.open": ["Anyone", "Tout le monde"],
  "admin.signup.open.about": [
    "Whoever reaches this server can create an account.",
    "Quiconque atteint ce serveur peut créer un compte.",
  ],
  "admin.signup.invitation": [
    "Whoever you invite",
    "Les personnes que vous invitez",
  ],
  "admin.signup.invitation.about": [
    "An account is created from an invitation link.",
    "Un compte se crée depuis un lien d’invitation.",
  ],
  "admin.signup.closed": ["Nobody", "Personne"],
  "admin.signup.closed.about": [
    "No new account. The accounts that exist are not affected.",
    "Aucun nouveau compte. Les comptes existants ne sont pas touchés.",
  ],
  "admin.invite.title": ["Invitations", "Invitations"],
  "admin.invite.lead": [
    "A link that creates accounts: as many as you say, until it expires. The server does not know who you give it to.",
    "Un lien qui crée des comptes : autant que vous le dites, jusqu’à son expiration. Le serveur ne sait pas à qui vous le donnez.",
  ],
  "admin.invite.closed-note": [
    "Sign-up is closed: an invitation opens nothing until you change that.",
    "L’inscription est fermée : une invitation n’ouvre rien tant que vous ne changez pas cela.",
  ],
  "admin.invite.uses": ["Accounts it can create", "Comptes qu’elle peut créer"],
  "admin.invite.days": ["Days it lasts", "Durée en jours"],
  "admin.invite.create": ["Create an invitation", "Créer une invitation"],
  "admin.invite.created": [
    "Give this address to the people you invite. It is shown only now.",
    "Donnez cette adresse aux personnes que vous invitez. Elle n’est affichée que maintenant.",
  ],
  "admin.invite.left": [
    "Accounts left: {count}, until {date}",
    "Comptes restants : {count}, jusqu’au {date}",
  ],
  "admin.invite.revoke": ["Revoke", "Révoquer"],
  "admin.invite.revoked": [
    "The invitation was revoked.",
    "L’invitation a été révoquée.",
  ],
  "admin.invite.none": [
    "No invitation is waiting.",
    "Aucune invitation en attente.",
  ],

  "admin.log.title": ["Log", "Journal"],
  "admin.log.lead": [
    "What administrators did, and what was done on the machine. Accounts are kept as identifiers: a deleted account is named nowhere. Entries are deleted after the period set by the server’s operator, a year unless changed.",
    "Ce que les administrateurs ont fait, et ce qui a été fait sur la machine. Les comptes y sont gardés comme des identifiants : un compte supprimé n’est nommé nulle part. Les entrées sont effacées après la durée fixée par l’opérateur du serveur, un an sauf réglage contraire.",
  ],
  "admin.log.none": ["Nothing yet.", "Rien pour l’instant."],
  "admin.log.by.machine": ["on the machine", "sur la machine"],
  "admin.log.by.deleted": [
    "by an administrator whose account was deleted",
    "par un administrateur dont le compte a été supprimé",
  ],
  "admin.log.by": ["by {name}", "par {name}"],
  "admin.log.account": ["Account: {name}", "Compte : {name}"],
  "admin.log.account.deleted": [
    "An account deleted since",
    "Un compte supprimé depuis",
  ],
  "admin.log.action.setup-redeemed": [
    "First administrator created with the setup link",
    "Premier administrateur créé avec le lien de mise en place",
  ],
  "admin.log.action.administrator-link": [
    "Administrator link made",
    "Lien d’administrateur créé",
  ],
  "admin.log.action.administrator-claimed": [
    "Role taken with a link",
    "Rôle pris avec un lien",
  ],
  "admin.log.action.administrator-grant": ["Role granted", "Rôle accordé"],
  "admin.log.action.administrator-withdraw": ["Role withdrawn", "Rôle retiré"],
  "admin.log.action.account-suspend": ["Account suspended", "Compte suspendu"],
  "admin.log.action.account-unsuspend": [
    "Suspension lifted",
    "Suspension levée",
  ],
  "admin.log.action.account-delete": ["Account deleted", "Compte supprimé"],
  "admin.log.action.application-register": [
    "Application registered",
    "Application enregistrée",
  ],
  "admin.log.action.application-attributes": [
    "What an application may ask was changed",
    "Ce qu’une application peut demander a été modifié",
  ],
  "admin.log.action.application-remove": [
    "Application removed",
    "Application retirée",
  ],
  "admin.log.action.signup-policy": [
    "Who may create an account was set",
    "Qui peut créer un compte a été fixé",
  ],
  "admin.log.action.invitation-create": [
    "Invitation created",
    "Invitation créée",
  ],
  "admin.log.action.invitation-revoke": [
    "Invitation revoked",
    "Invitation révoquée",
  ],

  // -- identities --------------------------------------------------------------
  "identities.eyebrow": ["Your identities", "Vos identités"],
  "identities.title.lead": ["One self,", "Un seul soi,"],
  "identities.title.accent": ["many faces.", "plusieurs visages."],
  "identities.compare": ["Compare", "Comparer"],
  "identities.card.nothing": [
    "No information yet: applications get an identifier only.",
    "Aucune information pour l’instant : les applications ne reçoivent qu’un identifiant.",
  ],
  "identities.card.has": ["Holds: {list}.", "Contient : {list}."],
  "identities.card.suggestion": ["{count} suggestion", "{count} suggestion"],
  "identities.card.suggestions": ["{count} suggestions", "{count} suggestions"],
  "identity.eyebrow": ["Identity", "Identité"],
  "identity.tab.summary": ["Summary", "Résumé"],
  "identity.tab.info": ["My information", "Mes informations"],
  "identity.tab.usage": ["Usage", "Utilisation"],
  "identity.info.title": ["My information", "Mes informations"],
  "identity.tips.title": ["Suggestions", "Suggestions"],
  "identity.tip.set": ["Set {attribute}:", "Définir {attribute} :"],
  "identity.tip.change": ["Change {attribute} to", "Changer {attribute} en"],
  "identity.tip.from-device": [
    "As this device says.",
    "Comme l’indique cet appareil.",
  ],
  "identity.tip.from-identity": [
    "As in {identity}. The same value in two identities makes them easier to match.",
    "Comme dans {identity}. Une même valeur dans deux identités les rend plus faciles à recouper.",
  ],
  "identity.tip.apply": ["Set", "Définir"],
  "identity.tip.ignore": ["Ignore", "Ignorer"],
  "identity.glance.title": ["At a glance", "En bref"],
  "identity.glance.no-info": ["Nothing yet.", "Rien pour l’instant."],
  "identity.glance.info": ["{list}.", "{list}."],
  "identity.glance.no-apps": [
    "No application yet.",
    "Aucune application pour l’instant.",
  ],
  "identity.glance.apps": ["{list}.", "{list}."],
  "identity.glance.see": ["See", "Voir"],

  // -- the identities side by side -------------------------------------------------
  "compare.eyebrow": ["Side by side", "Côte à côte"],
  "compare.title.lead": ["Your identities,", "Vos identités,"],
  "compare.title.accent": ["kept apart.", "bien séparées."],
  "compare.lead": [
    "What each one holds and where it is used. Only you see this page: to an application, two identities are two strangers.",
    "Ce que chacune contient et où elle sert. Vous seul voyez cette page : pour une application, deux identités sont deux inconnus.",
  ],
  "compare.caption": [
    "Your identities, their attributes and the applications that use them",
    "Vos identités, leurs attributs et les applications qui s’en servent",
  ],
  "compare.apart": [
    "brig·id keeps your identities apart. But the same value entered in two of them makes it easier for data brokers to match them: keep them different where you can.",
    "brig·id isole vos identités. Mais une même valeur renseignée dans deux d’entre elles facilite le recoupement par les courtiers en données : gardez-les différentes autant que possible.",
  ],
  "compare.same.lead": [
    "Some values are the same in two identities. An application that receives one from both can tell they are you:",
    "Certaines valeurs sont les mêmes dans deux identités. Une application qui la reçoit des deux peut savoir qu’il s’agit de vous :",
  ],
  "compare.same": ["{attribute}: {identities}", "{attribute} : {identities}"],
  "compare.same.short": [
    "(the same in another identity)",
    "(la même dans une autre identité)",
  ],
  "compare.attribute": ["Attribute", "Attribut"],
  "compare.used-by": ["Used by", "Utilisée par"],
  "compare.used-by.none": ["No application", "Aucune application"],
  "compare.two-strangers": [
    "{sites} know several of your identities: to each of them, these are different people.",
    "{sites} connaissent plusieurs de vos identités : pour chacune, ce sont des personnes différentes.",
  ],
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
  "identity.form.name": ["Name", "Nom"],
  "identity.form.name.hint": [
    "Only you see it. No application receives it.",
    "Vous seul le voyez. Aucune application ne le reçoit.",
  ],
  "identity.form.description": ["Description", "Description"],
  "identity.form.logo": ["Icon", "Icône"],
  "identity.create": ["Create", "Créer"],
  "identity.saved": ["Identity saved.", "Identité enregistrée."],
  "identity.deleted": ["“{name}” deleted.", "« {name} » supprimée."],
  "identity.edit": ["Edit", "Modifier"],
  "identity.delete": ["Delete", "Supprimer"],
  "identity.delete.confirm": [
    "Delete “{name}”? This cannot be undone.",
    "Supprimer « {name} » ? Cette action est définitive.",
  ],
  "identity.delete.yes": ["Yes, delete", "Oui, supprimer"],
  "identity.open": ["Open", "Ouvrir"],
  "title.new-identity": ["New identity", "Nouvelle identité"],
  "new.eyebrow": ["New identity", "Nouvelle identité"],
  "new.title.lead": ["Who will you", "Qui serez-vous"],
  "new.title.accent": ["be this time?", "cette fois-ci ?"],
  "new.lead": [
    "Pick an archetype and the identity is ready; you can change everything afterwards. Or start from a blank page.",
    "Choisissez un archétype et l’identité est prête ; vous pourrez tout changer ensuite. Ou partez d’une page blanche.",
  ],
  "new.archetypes": ["Archetypes", "Archétypes"],
  "new.manual": ["By hand", "À la main"],
  "new.all-used": [
    "You already have an identity for every archetype. Make one by hand.",
    "Vous avez déjà une identité pour chaque archétype. Créez-en une à la main.",
  ],

  // -- one identity: attributes, and what uses it ---------------------------------
  "identity.back": ["All identities", "Toutes les identités"],
  "identity.gone": [
    "This identity does not exist, or no longer does.",
    "Cette identité n’existe pas, ou plus.",
  ],
  "identity.label.note": [
    "Its name, icon and description are for you only. No application receives them.",
    "Son nom, son icône et sa description ne sont que pour vous. Aucune application ne les reçoit.",
  ],
  "identity.attributes.lead": [
    "Information you put on this identity so that applications can ask for it. An application receives a piece of it only once you have accepted, with the value you saw.",
    "Des informations que vous placez sur cette identité pour que des applications puissent les demander. Une application n’en reçoit une que lorsque vous l’avez accepté, avec la valeur que vous avez vue.",
  ],
  "identity.attributes.none": [
    "Nothing yet: applications receive an identifier, and nothing else.",
    "Rien pour l’instant : les applications reçoivent un identifiant, et rien d’autre.",
  ],
  "identity.attributes.linking": [
    "The same last name, username or address on two identities lets applications understand that they belong to one person. Nothing can undo that once it is shared.",
    "Le même nom, le même nom d’utilisateur ou la même adresse sur deux identités permet à des applications de comprendre qu’elles appartiennent à une seule personne. Rien ne peut le défaire une fois l’information partagée.",
  ],
  "identity.attributes.username.hint": [
    "A handle shown to applications. It is not a name to sign in with.",
    "Un pseudonyme montré aux applications. Ce n’est pas un nom pour se connecter.",
  ],
  "identity.attributes.email.hint": [
    "Recommended: many applications need one. It is shared as not verified.",
    "Recommandée : beaucoup d’applications en ont besoin. Elle est partagée comme non vérifiée.",
  ],
  "identity.attributes.email.same": [
    "**{name}** already has this address. Shared through both identities, it tells applications that they are one person. A variant of the same mailbox (name+work@…) protects little.",
    "**{name}** a déjà cette adresse. Partagée par les deux identités, elle indique aux applications qu’il s’agit d’une seule personne. Une variante de la même boîte (nom+travail@…) protège peu.",
  ],
  "identity.attributes.locale.hint": [
    "A language tag, such as en-GB or fr.",
    "Un code de langue, par exemple fr ou en-GB.",
  ],
  "identity.attributes.zoneinfo.hint": [
    "A time zone name, such as Europe/Paris.",
    "Un nom de fuseau horaire, par exemple Europe/Paris.",
  ],
  "identity.attributes.saved": [
    "Saved. Where a value changed, an application receives the new one only after asking you again.",
    "Enregistré. Là où une valeur a changé, une application ne reçoit la nouvelle qu’après vous l’avoir redemandée.",
  ],
  "identity.attributes.invalid": [
    "A value was not accepted. Check what you entered.",
    "Une valeur n’a pas été acceptée. Vérifiez votre saisie.",
  ],
  "identity.used-by": ["Used by", "Utilisée par"],
  "identity.used-by.applications": ["Applications", "Applications"],
  "identity.used-by.none": [
    "No application yet. One appears here the first time you sign in to it with this identity.",
    "Aucune application pour l’instant. Une application apparaît ici la première fois que vous vous y connectez avec cette identité.",
  ],
  "identity.app.dates": [
    "First sign-in on {first}, latest on {last}.",
    "Première connexion le {first}, dernière le {last}.",
  ],
  "identity.app.identifier-only": [
    "It received an identifier, and nothing else.",
    "Elle a reçu un identifiant, et rien d’autre.",
  ],
  "identity.app.received": [
    "It received an identifier, and:",
    "Elle a reçu un identifiant, et :",
  ],
  "identity.app.since": ["accepted on {date}", "accepté le {date}"],
  "identity.app.outdated": [
    "You changed this value since. The new one is not sent until you accept it.",
    "Vous avez changé cette valeur depuis. La nouvelle n’est pas envoyée tant que vous ne l’avez pas acceptée.",
  ],
  "identity.app.refused": [
    "You refused to share it.",
    "Vous avez refusé de le partager.",
  ],
  "identity.app.stop": ["Stop sharing", "Ne plus partager"],
  "identity.app.ask-again": ["Ask me again", "Me redemander"],
  "identity.app.stopped": [
    "Done. {app} keeps what it already received; this server sends it nothing more of it without asking you.",
    "C’est fait. {app} conserve ce qu’elle a déjà reçu ; ce serveur ne lui en envoie plus rien sans vous le demander.",
  ],
  "identity.app.withdraw": ["Withdraw everything", "Tout retirer"],
  "identity.app.withdraw.confirm": [
    "Withdraw everything this identity gives **{app}**? This server then sends it nothing until you sign in there again. It cannot take back what {app} already received, and {app} will recognise this identity if you come back with it.",
    "Retirer tout ce que cette identité donne à **{app}** ? Ce serveur ne lui envoie alors plus rien tant que vous ne vous y reconnectez pas. Il ne peut pas reprendre ce que {app} a déjà reçu, et {app} reconnaîtra cette identité si vous y revenez avec elle.",
  ],
  "identity.app.withdraw.yes": ["Yes, withdraw", "Oui, retirer"],
  "identity.app.withdrawn": [
    "Withdrawn. {app} keeps what it already received.",
    "Retiré. {app} conserve ce qu’elle a déjà reçu.",
  ],
  "identity.connected-to": ["Connected to", "Reliée à"],
  "identity.connected-to.none": [
    "Nothing. This version does not connect an identity to outside services.",
    "Rien. Cette version ne relie pas une identité à des services extérieurs.",
  ],

  "attribute.given-name": ["First name", "Prénom"],
  "attribute.family-name": ["Last name", "Nom de famille"],
  "attribute.preferred-username": ["Username", "Nom d’utilisateur"],
  "attribute.email": ["E-mail address", "Adresse e-mail"],
  "attribute.locale": ["Language", "Langue"],
  "attribute.zoneinfo": ["Time zone", "Fuseau horaire"],

  "archetype.public": ["Public", "Publique"],
  "archetype.public.about": [
    "For everyone you come across online.",
    "Pour tous ceux que vous croisez en ligne.",
  ],
  "archetype.personal": ["Personal", "Personnelle"],
  "archetype.personal.about": [
    "Yours alone: not even aunt Monique gets in.",
    "Rien qu’à vous : même tata Monique n’y a pas droit.",
  ],
  "archetype.family": ["Family", "Famille"],
  "archetype.family.about": [
    "Family life: the school, the doctor, the group photos.",
    "La vie de famille : l’école, le médecin, les photos de groupe.",
  ],
  "archetype.friends": ["Friends", "Amis"],
  "archetype.friends.about": [
    "Plans, games and group chats with friends.",
    "Les sorties, les jeux et les groupes entre amis.",
  ],
  "archetype.shopping": ["Shopping", "Achats"],
  "archetype.shopping.about": [
    "Online shops and deliveries, nothing more.",
    "Les boutiques en ligne et les livraisons, rien de plus.",
  ],
  "archetype.work": ["Work", "Travail"],
  "archetype.work.about": [
    "All the work stuff: serious, no fun.",
    "Tout le work stuff : sérieux, et sans fun.",
  ],
  "archetype.freelance": ["Freelance", "Indépendant"],
  "archetype.freelance.about": [
    "Clients, quotes and invoices.",
    "Les clients, les devis et les factures.",
  ],
  "archetype.job-search": ["Job search", "Recherche d’emploi"],
  "archetype.job-search.about": [
    "Job boards and applications, ready for the interview.",
    "Les sites d’emploi et les candidatures, prête pour l’entretien.",
  ],
  "archetype.student": ["Student", "Études"],
  "archetype.student.about": [
    "Courses, campus and exam season.",
    "Les cours, le campus et les partiels.",
  ],
  "archetype.volunteering": ["Volunteering", "Bénévolat"],
  "archetype.volunteering.about": [
    "The associations and causes you give time to.",
    "Les associations et les causes auxquelles vous donnez du temps.",
  ],
  "archetype.gaming": ["Gaming", "Jeu vidéo"],
  "archetype.gaming.about": [
    "Lobbies, clans and late nights.",
    "Les lobbies, les clans et les nuits blanches.",
  ],
  "archetype.music": ["Music", "Musique"],
  "archetype.music.about": [
    "Playlists, concerts and the band.",
    "Les playlists, les concerts et le groupe.",
  ],
  "archetype.sport": ["Sport", "Sport"],
  "archetype.sport.about": [
    "Training, the club and race results.",
    "Les entraînements, le club et les résultats de course.",
  ],
  "archetype.travel": ["Travel", "Voyage"],
  "archetype.travel.about": [
    "Tickets, bookings and the next trip.",
    "Les billets, les réservations et le prochain voyage.",
  ],
  "archetype.reading": ["Reading", "Lecture"],
  "archetype.reading.about": [
    "Books, libraries and reading lists.",
    "Les livres, les bibliothèques et les listes de lecture.",
  ],
  "archetype.creative": ["Creative", "Création"],
  "archetype.creative.about": [
    "Sketches, projects and creative circles.",
    "Les esquisses, les projets et les cercles créatifs.",
  ],
  "archetype.developer": ["Developer", "Développement"],
  "archetype.developer.about": [
    "Code, forges and package registries.",
    "Le code, les forges et les registres de paquets.",
  ],
  "archetype.social": ["Social", "Réseaux sociaux"],
  "archetype.social.about": [
    "Social networks, with the face you choose.",
    "Les réseaux sociaux, avec le visage que vous choisissez.",
  ],
  "archetype.forums": ["Forums", "Forums"],
  "archetype.forums.about": [
    "Forums and comment threads, under a pen name.",
    "Les forums et les commentaires, sous un pseudonyme.",
  ],
  "archetype.isolated": ["Isolated", "Isolée"],
  "archetype.isolated.about": [
    "Detective mode: tied to nothing else.",
    "Mode détective : reliée à rien d’autre.",
  ],
  "archetype.testing": ["Testing", "Essais"],
  "archetype.testing.about": [
    "Sign-ups to try something out, then forget.",
    "Les inscriptions pour essayer, puis oublier.",
  ],
  "archetypes.group.everyday": ["Everyday", "Au quotidien"],
  "archetypes.group.work": ["Work and studies", "Travail et études"],
  "archetypes.group.leisure": ["Leisure", "Loisirs"],
  "archetypes.group.online": ["Online", "En ligne"],

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
  "passkeys.several": [
    "You can have several: one per place that keeps them. A second passkey lets you in when the first is out of reach.",
    "Vous pouvez en avoir plusieurs : une par endroit qui les garde. Une deuxième clé d’accès vous laisse entrer quand la première n’est pas à portée.",
  ],
  "passkeys.where.title": [
    "Where will this passkey be kept?",
    "Où cette clé d’accès sera-t-elle gardée ?",
  ],
  "passkeys.where.lead": [
    "A password manager, a device or a security key keeps one passkey for your account. Choose a place that has none yet.",
    "Un gestionnaire de mots de passe, un appareil ou une clé de sécurité garde une seule clé d’accès pour votre compte. Choisissez un endroit qui n’en a pas encore.",
  ],
  "passkeys.where.device": ["On this device", "Sur cet appareil"],
  "passkeys.where.device.about": [
    "In this computer, phone or tablet, or in the password manager of this browser.",
    "Dans cet ordinateur, ce téléphone ou cette tablette, ou dans le gestionnaire de mots de passe de ce navigateur.",
  ],
  "passkeys.where.phone": [
    "On another phone or tablet",
    "Sur un autre téléphone ou une autre tablette",
  ],
  "passkeys.where.phone.about": [
    "Your browser shows a QR code to scan with it.",
    "Votre navigateur affiche un code QR à scanner avec lui.",
  ],
  "passkeys.where.key": ["On a security key", "Sur une clé de sécurité"],
  "passkeys.where.key.about": [
    "A key you plug in or hold near the device.",
    "Une clé que vous branchez ou approchez de l’appareil.",
  ],
  "passkeys.where.any": [
    "Let my browser propose",
    "Laisser mon navigateur proposer",
  ],
  "passkeys.where.any.about": [
    "It asks where, in its own way.",
    "Il demande où, à sa façon.",
  ],
  "passkeys.exists": [
    "That place already holds a passkey for your account, and keeps only one. Choose another place: another device, another password manager, or a security key.",
    "Cet endroit garde déjà une clé d’accès pour votre compte, et n’en garde qu’une. Choisissez un autre endroit : un autre appareil, un autre gestionnaire de mots de passe ou une clé de sécurité.",
  ],
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
