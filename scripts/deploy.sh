eval "$(ssh-agent -s)"
echo "$DEPLOY_KEY" > deploy_key.pem
chmod 600 deploy_key.pem
ssh-add deploy_key.pem
git remote add deploy $REPO_URI
git push deploy master -f
