import { ccc } from "@ckb-ccc/core";
import { Provider } from "./advancedBarrel";

/**
 * Class representing a Bitcoin signer that extends SignerBtc from @ckb-ccc/core.
 * @class
 * @extends {ccc.SignerBtc}
 */
export class Signer extends ccc.SignerBtc {
  /**
   * Creates an instance of Signer.
   * @param {ccc.Client} client - The client instance.
   * @param {Provider} provider - The provider instance.
   */
  constructor(
    client: ccc.Client,
    public readonly provider: Provider,
    private readonly preferredNetworks: ccc.NetworkPreference[] = [
      {
        addressPrefix: "ckb",
        signerType: ccc.SignerType.BTC,
        network: "btc",
      },
      {
        addressPrefix: "ckt",
        signerType: ccc.SignerType.BTC,
        network: "btcTestnet",
      },
    ],
  ) {
    super(client);
  }

  /**
   * Ensure the BTC network is the same as CKB network.
   */
  async ensureNetwork(): Promise<void> {
    const currentNetwork = await (async () => {
      if (this.provider.getChain) {
        return (
          {
            BITCOIN_MAINNET: "btc",
            BITCOIN_TESTNET: "btcTestnet",
            FRACTAL_BITCOIN_MAINNET: "fractalBtc",
          }[(await this.provider.getChain()).enum] ?? ""
        );
      }
      return (await this.provider.getNetwork()) === "livenet"
        ? "btc"
        : "btcTestnet";
    })();
    const { network } = this.matchNetworkPreference(
      this.preferredNetworks,
      currentNetwork,
    ) ?? { network: currentNetwork };
    if (network === currentNetwork) {
      return;
    }
    if (this.provider.switchChain) {
      const chain = {
        btc: "BITCOIN_MAINNET",
        btcTestnet: "BITCOIN_TESTNET",
        fractalBtc: "FRACTAL_BITCOIN_MAINNET",
      }[network];
      if (chain) {
        await this.provider.switchChain(chain);
        return;
      }
    } else if (network === "btc" || network === "btcTestnet") {
      await this.provider.switchNetwork(
        network === "btc" ? "livenet" : "testnet",
      );
    }
    throw new Error(
      `UniSat wallet doesn't support the requested chain ${network}`,
    );
  }

  /**
   * Gets the Bitcoin account address.
   * @returns {Promise<string>} A promise that resolves to the Bitcoin account address.
   */
  async getBtcAccount(): Promise<string> {
    return (await this.provider.getAccounts())[0];
  }

  /**
   * Gets the Bitcoin public key.
   * @returns {Promise<ccc.Hex>} A promise that resolves to the Bitcoin public key.
   */
  async getBtcPublicKey(): Promise<ccc.Hex> {
    return ccc.hexFrom(await this.provider.getPublicKey());
  }

  /**
   * Connects to the provider by requesting accounts.
   * @returns {Promise<void>} A promise that resolves when the connection is established.
   */
  async connect(): Promise<void> {
    await this.provider.requestAccounts();
    await this.ensureNetwork();
  }

  async replaceClient(client: ccc.Client): Promise<boolean> {
    if (await super.replaceClient(client)) {
      await this.ensureNetwork();
      return true;
    }
    return false;
  }

  /**
   * Checks if the signer is connected.
   * @returns {Promise<boolean>} A promise that resolves to true if connected, false otherwise.
   */
  async isConnected(): Promise<boolean> {
    return (await this.provider.getAccounts()).length !== 0;
  }

  /**
   * Signs a raw message with the Bitcoin account.
   * @param {string | ccc.BytesLike} message - The message to sign.
   * @returns {Promise<string>} A promise that resolves to the signed message.
   */
  async signMessageRaw(message: string | ccc.BytesLike): Promise<string> {
    const challenge =
      typeof message === "string" ? message : ccc.hexFrom(message).slice(2);

    return this.provider.signMessage(challenge, "ecdsa");
  }
}
