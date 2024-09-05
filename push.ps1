pushd frontend/app
yarn build
popd
npx cdk deploy --all --profile jasongauci -v
