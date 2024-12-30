import { localized, msg } from "@lit/localize";
import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import blake from "blakejs";
import { fromUint8Array } from "js-base64";
import { mdiAlertOutline } from "@mdi/js";

import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/input/input.js";
import "@shoelace-style/shoelace/dist/components/card/card.js";
import "@shoelace-style/shoelace/dist/components/icon/icon.js";
import "@shoelace-style/shoelace/dist/components/alert/alert.js";

function hash(password: string) {
  return fromUint8Array(blake.blake2b(password));
}
function wrapPathInSvg(path: string): string {
  return `data:image/svg+xml;utf8,${wrapPathInSvgWithoutPrefix(path)}`;
}
function wrapPathInSvgWithoutPrefix(path: string): string {
  return `<svg style='fill: currentColor' viewBox='0 0 24 24'><path d='${path}'></path></svg>`;
}

function getPassword(passwordHash: string) {
  return localStorage.getItem(passwordHash);
}

function setPassword(passwordHash: string, password: string) {
  return localStorage.setItem(passwordHash, password);
}

/**
 * @element password-protected-content
 */
@localized()
@customElement("password-protected-content")
export class PasswordProtectedContent extends LitElement {
  @property({ attribute: "password-hashes" })
  passwordHashes: string = "";

  firstUpdated() {
    if (!this.passwordEntered) {
      this.innerHTML = "";
    }
  }

  get hashes() {
    return this.passwordHashes.split(",");
  }

  get passwordEntered() {
    return !!this.hashes.find((passwordHash) => {
      const storedPassword = getPassword(passwordHash);
      if (!storedPassword) return false;
      return hash(storedPassword) === passwordHash;
    });
  }

  get passwordInput() {
    return this.shadowRoot!.querySelector("sl-input");
  }

  enterPassword(password: string) {
    const passwordHash = hash(password);
    if (this.passwordHashes.includes(passwordHash)) {
      setPassword(passwordHash, password);
      window.location.reload();
    } else {
      const alert = this.shadowRoot!.querySelector("sl-alert")!;
      alert.toast();
      this.passwordInput!.value = "";
    }
    this.requestUpdate();
  }

  render() {
    if (this.passwordEntered) return html`<slot></slot>`;

    return html`
      <sl-alert variant="danger" duration="3000">
        <sl-icon slot="icon" .src=${wrapPathInSvg(mdiAlertOutline)}></sl-icon>

        ${msg("Wrong password, please try again.")}
      </sl-alert>
      <div
        class="column"
        style="flex: 1; justify-content: center; align-items: center"
      >
        <sl-card>
          <div class="column" style="gap: 16px;">
            <span style="font-size: 20px">Enter Password</span>
            <sl-input
              .placeholder=${msg("Password")}
              @sl-input=${() => this.requestUpdate()}
            >
            </sl-input>
            <sl-button
              variant="primary"
              .disabled=${!this.passwordInput?.value}
              @click=${() => this.enterPassword(this.passwordInput!.value)}
              >${msg("Enter Password")}
            </sl-button>
          </div>
        </sl-card>
      </div>
    `;
  }

  static styles = [
    css`
      :host {
        flex: 1;
        display: flex;
      }
      .column {
        display: flex;
        flex-direction: column;
      }
    `,
  ];
}
