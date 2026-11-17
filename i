#!/bin/bash
# Envoie la fonction des rappels Salle Padel sur Firebase (à lancer dans Google Cloud Shell).
set -e
cd ~
rm -rf les-mimichats
echo "1/3 Téléchargement…"
git clone -q --depth 1 https://github.com/thib0703/les-mimichats
cd les-mimichats/serveur/functions && npm install --silent --no-audit --no-fund && cd ..
gcloud config set project les-mimichats >/dev/null 2>&1 || true
echo "2/3 Envoi de la fonction des rappels (2-4 min)…"
deploy() { npx -y firebase-tools deploy --only functions:rappelsSallePadel --project les-mimichats --non-interactive --force; }
if ! deploy; then
  echo ""
  echo "Connexion à Firebase nécessaire : réponds n, ouvre le lien, autorise, puis tape le code affiché."
  npx -y firebase-tools login --no-localhost </dev/tty
  deploy
fi
echo ""
echo "3/3 C'est bon ! Retourne dans Salle Padel > Réglages > Rappels > Activer les rappels."
