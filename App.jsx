import { TextField, Stack, Button, ListItem, ListItemText, Switch } from "@mui/material";
import { Page, Toolbar } from "@mmrl/ui";
import FlatList from "flatlist-react";

import { useMultipleInputs } from "./hooks/useMutipleInputs";
import { sync_build_deploy } from "./util/sync_build_deploy";
import { createFileTree } from "./util/createFileTree";

const App = () => {
  const { values, handleChange, handleBoolChange } = useMultipleInputs({
    name: "Example Repo",
    website: "",
    support: "",
    donate: "",
    submission: "",
    base_url: "https://example.com/",
    max_num: 3,
    enable_log: true,
    log_dir: "log",
    baseSitemapUrl: "",
  });

  const handleGenerate = React.useCallback(() => {
    const keysToOmit = ["baseSitemapUrl"];

    const newValues = Object.keys(values).reduce((acc, key) => {
      if (!keysToOmit.includes(key)) {
        acc[key] = values[key];
      }
      return acc;
    }, {});

    const generatePath = "/data/local/tmp";

    const fileTree = {
      "/Repo-Generator": {
        "/modules": {
          "/mmrl_wpd": {
            "/track.json": JSON.stringify(
              {
                id: "mmrl_wpd",
                enable: true,
                verified: true,
                update_to: "https://github.com/Googlers-Repo/wpd.git",
                source: "https://github.com/Googlers-Repo/wpd.git",
                support: "https://github.com/Googlers-Repo/wpd/issues",
                categories: ["Configurable", "Tweaks and Hacks", "Miscellaneous"],
                readme: "https://raw.githubusercontent.com/Googlers-Repo/wpd/master/README.md",
                added: 1445340430.7142262,
                last_update: 1726161214.0,
                versions: 3,
              },
              null,
              4
            ),
          },
        },
        "/json": {
          "/config.json": JSON.stringify(newValues, null, 4),
        },
        "/modules.json": JSON.stringify(
          {
            name: values.name,
            website: values.website,
            support: values.support,
            donate: values.donate,
            submission: values.submission,
            metadata: {
              version: 1,
              timestamp: 0,
            },
            modules: [],
          },
          null,
          4
        ),
        "/.github": {
          "/workflows": {
            "/sync_build_deploy.yml": sync_build_deploy(values.baseSitemapUrl),
          },
        },
      },
    };

    createFileTree(fileTree, generatePath);

    const zip = new SuFile(path.resolve(__dirname, "bin/zip"));

    if (!zip.canExecute()) {
      Shell.cmd(`chmod 755 ${zip.getPath()}`).exec();
    }

    const sh = Shell.cmd(`cd ${generatePath}/Repo-Generator && ${zip.getPath()} -r9 /sdcard/Download/generated-repo-$RANDOM.zip \\.* *`);
    console.log(sh.result());
  }, [values]);

  return (
    <Page
      sx={{ p: 2 }}
      renderToolbar={() => (
        <Toolbar modifier="noshadow">
          <Toolbar.Left></Toolbar.Left>
          <Toolbar.Center>Repo Generator</Toolbar.Center>
        </Toolbar>
      )}
    >
      <Button sx={{ mt: 1 }} fullWidth variant="contained" onClick={handleGenerate}>
        Generate
      </Button>

      <Stack
        direction="column"
        spacing={2}
        sx={{
          mt: 2,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <FlatList
          list={Object.entries(values)}
          renderItem={(entries, idx) => {
            const key = entries[0];
            const value = entries[1];

            switch (typeof value) {
              case "boolean":
                return (
                  <ListItem key={idx}>
                    <ListItemText primary={key} />
                    <Switch id={key} edge="end" onChange={handleBoolChange} checked={value} />
                  </ListItem>
                );

              default:
                return <TextField key={idx} id={key} type={typeof value} label={key} value={values[key]} onChange={handleChange} fullWidth />;
            }
          }}
          renderOnScroll
          renderWhenEmpty={() => <></>}
        />
      </Stack>
    </Page>
  );
};

export { App };
