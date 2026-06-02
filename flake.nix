{
  description = "http server";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs =
    { nixpkgs, ... }:
    let
      supportedSystems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];

      forAllSystems = f: nixpkgs.lib.genAttrs supportedSystems (system: f system);
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = import nixpkgs {
            inherit system;
            config.allowUnfree = true;
          };
        in
        {
          default = pkgs.mkShell {
            name = "typescript discord bot shell";

            nativeBuildInputs = with pkgs; [
              nodejs
              openssl
              typescript
              typescript-language-server
            ];

            shellHook = ''
              export fish_history=dev_bot_discord_vanne
              echo "Bot Discord Vanne DevShell"
              echo ""
              echo "Install dependencies with 'npm install'"
              echo "Run 'nix develop --command fish' to use fish from the start"
            '';
          };
        }
      );
    };
}
