import { ccc } from "@ckb-ccc/core";
import { ProviderDetail as EIP6963ProviderDetail } from "./eip6963.advanced";

/**
 * Class representing an EVM signer that extends SignerEvm from @ckb-ccc/core.
 * @class
 * @extends {ccc.SignerEvm}
 */
export class Signer extends ccc.SignerEvm {
  /**
   * Creates an instance of Signer.
   * @param {ccc.Client} client - The client instance.
   * @param {EIP6963ProviderDetail} detail - The provider detail.
   */
  constructor(
    client: ccc.Client,
    public readonly detail: EIP6963ProviderDetail,
  ) {
    super(client);
  }

  /**
   * Gets the EVM account address.
   * @returns A promise that resolves to the EVM account address.
   */
  async getEvmAccount() {
    return (await this.detail.provider.request({ method: "eth_accounts" }))[0];
  }

  /**
   * Connects to the provider by requesting accounts.
   * @returns {Promise<void>} A promise that resolves when the connection is established.
   */
  async connect(): Promise<void> {
    await this.detail.provider.request({ method: "eth_requestAccounts" });
  }

  /**
   * Checks if the provider is connected.
   * @returns {Promise<boolean>} A promise that resolves to true if connected, false otherwise.
   */
  async isConnected(): Promise<boolean> {
    return (
      (await this.detail.provider.request({ method: "eth_accounts" }))
        .length !== 0
    );
  }

  /**
   * Signs a raw message with the personal account.
   * @param {string | ccc.BytesLike} message - The message to sign.
   * @returns {Promise<ccc.Hex>} A promise that resolves to the signed message.
   */
  async signMessageRaw(message: string | ccc.BytesLike): Promise<ccc.Hex> {
    const challenge =
      typeof message === "string" ? ccc.bytesFrom(message, "utf8") : message;
    const address = await this.getEvmAccount();

    return this.detail.provider.request({
      method: "personal_sign",
      params: [ccc.hexFrom(challenge), address],
    });
  }
}
