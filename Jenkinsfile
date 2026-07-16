// Jenkinsfile
// PipeLineOps CI/CD — 6 stages: validate, build, test, security scan,
// deploy, verify. Runs Node-based steps inside a node:22 Docker agent;
// deploy/verify steps use the amazon/aws-cli image since that's where
// the AWS CLI already lives.

pipeline {
  agent none

  options {
    // Same intent as the GitHub Actions concurrency group: don't let
    // three quick pushes pay for three full overlapping runs.
    disableConcurrentBuilds()
    timestamps()
  }

  environment {
    S3_BUCKET   = 'pipelineops-site'
    AWS_REGION  = 'us-east-1'
    SITE_URL    = "http://${S3_BUCKET}.s3-website-${AWS_REGION}.amazonaws.com/"
  }

  stages {

    // ---------------------------------------------------------------
    // Stage 1 — Validate
    // Cheapest checks first: lint markup/styles/scripts, confirm every
    // data file is valid JSON.
    // ---------------------------------------------------------------
    stage('1 · Validate') {
      agent { docker { image 'node:22' } }
      steps {
        sh '''
          npm install --no-save htmlhint stylelint stylelint-config-standard eslint
          npx htmlhint "index.html" "pages/*.html"
          npx stylelint "css/*.css" --config '{"extends":"stylelint-config-standard"}'
          npx eslint js/*.js --no-eslintrc --env browser,es2021 --parser-options=ecmaVersion:2021
          for f in data/*.json; do
            echo "Checking $f"
            node -e "JSON.parse(require('fs').readFileSync('$f'))"
          done
        '''
      }
    }

    // ---------------------------------------------------------------
    // Stage 2 — Build
    // Stamps this run's commit SHA, build number, and timestamp into
    // data/version.json, then stashes the whole workspace so later
    // stages (which run in different containers) work from the same
    // built artifact.
    // ---------------------------------------------------------------
    stage('2 · Build') {
      agent { docker { image 'node:22' } }
      steps {
        sh '''
          node -e "
            const fs = require('fs');
            const path = 'data/version.json';
            const data = JSON.parse(fs.readFileSync(path));
            const prev = { ...data };
            delete prev.history;

            data.build_number = process.env.BUILD_NUMBER;
            data.commit_sha = (process.env.GIT_COMMIT || 'unknown').slice(0, 7);
            data.branch = process.env.GIT_BRANCH || 'main';
            data.built_at = new Date().toISOString();
            data.workflow_run_url = process.env.BUILD_URL || null;
            data.status = 'success';

            data.history = [
              {
                version: data.version,
                build_number: data.build_number,
                commit_sha: data.commit_sha,
                environment: 'production',
                date: data.built_at,
                status: 'success'
              },
              ...(Array.isArray(prev.history) ? prev.history : []).slice(0, 9)
            ];

            fs.writeFileSync(path, JSON.stringify(data, null, 2));
            console.log(JSON.stringify(data, null, 2));
          "
        '''
        stash name: 'site-build', includes: '**', excludes: '.git/**,node_modules/**'
      }
    }

    // ---------------------------------------------------------------
    // Stage 3 — Test
    // Serves the built site locally and hits every page with a
    // headless browser, asserting each one loads.
    // ---------------------------------------------------------------
    stage('3 · Test') {
      agent { docker { image 'node:22' } }
      steps {
        unstash 'site-build'
        sh '''
          npm install --no-save playwright serve wait-on
          npx playwright install --with-deps chromium
          npx serve . -l 4173 &
          npx wait-on http://localhost:4173
          node -e "
            const { chromium } = require('playwright');
            const pages = [
              '/', '/pages/about.html', '/pages/pipeline.html',
              '/pages/security.html', '/pages/cost.html',
              '/pages/incidents.html', '/pages/deployment.html'
            ];
            (async () => {
              const browser = await chromium.launch();
              const page = await browser.newPage();
              for (const p of pages) {
                const res = await page.goto('http://localhost:4173' + p);
                if (!res.ok()) throw new Error(p + ' returned ' + res.status());
                console.log('OK', p);
              }
              await browser.close();
            })().catch((e) => { console.error(e); process.exit(1); });
          "
        '''
      }
    }

    // ---------------------------------------------------------------
    // Stage 4 — Security Scan
    // Secrets scanning has no override: a real finding fails the build.
    // ---------------------------------------------------------------
    stage('4 · Security Scan') {
      agent { docker { image 'zricethezav/gitleaks:latest'; args '--entrypoint=""' } }
      steps {
        unstash 'site-build'
        sh 'gitleaks detect --source . --no-git -v'
      }
    }

    // ---------------------------------------------------------------
    // Stage 5 — Deploy
    // Syncs the built site to the S3 bucket. Only runs on main.
    // ---------------------------------------------------------------
    stage('5 · Deploy') {
      when { branch 'main' }
      agent { docker { image 'amazon/aws-cli'; args '--entrypoint=""' } }
      environment {
  AWS_ACCESS_KEY_ID     = credentials('aws-jenkins-deploy-id')
  AWS_SECRET_ACCESS_KEY = credentials('aws-jenkins-deploy-secret')
}
      steps {
        unstash 'site-build'
        sh '''
          aws s3 sync . "s3://${S3_BUCKET}" \
            --delete \
            --exclude ".git/*" \
            --exclude "Jenkinsfile" \
            --exclude "node_modules/*" \
            --region "${AWS_REGION}"
        '''
      }
    }

    // ---------------------------------------------------------------
    // Stage 6 — Verify
    // Confirms the live site is up and serving the build that was
    // just deployed, not a stale cached version.
    // ---------------------------------------------------------------
    stage('6 · Verify') {
      when { branch 'main' }
      agent { docker { image 'amazon/aws-cli'; args '--entrypoint=""' } }
      steps {
        sh '''
          for i in 1 2 3 4 5; do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${SITE_URL}")
            if [ "$STATUS" = "200" ]; then
              echo "Site responded 200"
              break
            fi
            echo "Attempt $i: got $STATUS, retrying in 10s"
            sleep 10
            if [ "$i" = "5" ]; then
              echo "Site did not respond 200 after 5 attempts"
              exit 1
            fi
          done

          LIVE_SHA=$(curl -s "${SITE_URL}data/version.json" | grep -o '"commit_sha": *"[^"]*"' | sed -E 's/.*: *"([^"]*)"/\\1/')
          EXPECTED_SHA=$(echo "${GIT_COMMIT}" | cut -c1-7)
          echo "Live: $LIVE_SHA  Expected: $EXPECTED_SHA"
          if [ "$LIVE_SHA" != "$EXPECTED_SHA" ]; then
            echo "Deployed version does not match this build — failing loudly instead of serving stale content silently."
            exit 1
          fi
        '''
      }
    }
  }

  post {
    success {
      echo "Pipeline succeeded — live at ${env.SITE_URL}"
    }
    failure {
      echo "Pipeline failed — check the stage view above for which step broke."
    }
  }
}
