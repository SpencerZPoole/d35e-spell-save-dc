(() => {
  "use strict";

  const MODULE_ID = "d35e-spell-save-dc";
  const INSERTED_CHAT_CLASS = "d35e-spell-save-dc-row";
  const INSERTED_SHEET_CLASS = "d35e-spell-save-dc-summary";

  function isD35E() {
    return game?.system?.id === "D35E";
  }

  function debug(message, data) {
    if (!game?.settings?.get?.(MODULE_ID, "debug")) return;
    console.debug(`${MODULE_ID} | ${message}`, data ?? "");
  }

  function localize(key, fallback) {
    const value = game?.i18n?.localize?.(key);
    return value && value !== key ? value : fallback;
  }

  function normalizeHtml(html) {
    if (!html) return null;
    if (html instanceof HTMLElement) return html;
    if (html[0] instanceof HTMLElement) return html[0];
    if (html.element instanceof HTMLElement) return html.element;
    return null;
  }

  function getProperty(source, path) {
    return foundry?.utils?.getProperty?.(source, path);
  }

  function getActorForCard(card) {
    const actorId = card?.dataset?.actorId;
    const tokenId = card?.dataset?.tokenId;

    if (tokenId && canvas?.scenes) {
      const [sceneId, tokenDocumentId] = tokenId.split(".");
      const scene = canvas.scenes.get(sceneId);
      const token = scene?.tokens?.get(tokenDocumentId);
      if (token?.actor) return token.actor;
    }

    if (actorId) return game.actors?.get(actorId) ?? null;
    return null;
  }

  function spellCallsForSave(item) {
    if (!item || item.type !== "spell") return false;

    const saveType = getProperty(item, "system.save.type");
    const saveDescription = String(getProperty(item, "system.save.description") ?? "").trim();
    return Boolean(saveType) || (Boolean(saveDescription) && saveDescription.toLowerCase() !== "none");
  }

  function parseDCTotal(value) {
    const match = String(value ?? "").match(/\bDC\s*(\d+)\b/i) ?? String(value ?? "").match(/\b(\d+)\b/);
    return match ? Number.parseInt(match[1], 10) : null;
  }

  function findRenderedDCTotal(card) {
    const rollSaveButton = card.querySelector('button[data-action="rollSave"][data-target]');
    const buttonTarget = parseDCTotal(rollSaveButton?.dataset?.target);
    if (Number.isInteger(buttonTarget) && buttonTarget > 0) return buttonTarget;

    const dcValue = card.querySelector(".dc-value");
    const renderedTotal = parseDCTotal(dcValue?.textContent);
    if (Number.isInteger(renderedTotal) && renderedTotal > 0) return renderedTotal;

    const footerCandidates = card.querySelectorAll(".card-footer span, .card-footer .property-group label, .card-footer .property-group div, footer span");
    for (const candidate of footerCandidates) {
      const total = parseDCTotal(candidate.textContent);
      if (Number.isInteger(total) && total > 0 && /\bDC\b/i.test(candidate.textContent ?? "")) return total;
    }

    return null;
  }

  function insertChatDCRow(card, dcTotal) {
    if (card.querySelector(`.${INSERTED_CHAT_CLASS}`)) return;

    const row = document.createElement("div");
    row.className = `${INSERTED_CHAT_CLASS} flexrow`;

    const label = document.createElement("span");
    label.className = "d35e-spell-save-dc-label";
    label.textContent = localize("D35ESpellSaveDC.Chat.Label", "Spell Save DC");

    const value = document.createElement("strong");
    value.className = "d35e-spell-save-dc-value";
    value.textContent = String(dcTotal);

    row.append(label, value);

    const savingThrowBlock = card.querySelector(".dc-value")?.closest(".dice-roll");
    if (savingThrowBlock?.parentElement) {
      savingThrowBlock.parentElement.insertBefore(row, savingThrowBlock);
      return;
    }

    const content = card.querySelector(".card-content");
    if (content) {
      content.insertAdjacentElement("beforebegin", row);
      return;
    }

    card.append(row);
  }

  function enhanceChatMessage(html) {
    if (!isD35E()) return;

    const root = normalizeHtml(html);
    if (!root) return;

    const cards = root.matches?.(".D35E.chat-card.item-card")
      ? [root]
      : Array.from(root.querySelectorAll?.(".D35E.chat-card.item-card") ?? []);

    for (const card of cards) {
      const actor = getActorForCard(card);
      const itemId = card.dataset.itemId;
      const item = actor?.items?.get?.(itemId) ?? game.items?.get?.(itemId) ?? null;

      if (!spellCallsForSave(item)) {
        debug("Skipping chat card without a spell saving throw.", { itemId, actor: actor?.name });
        continue;
      }

      const dcTotal = findRenderedDCTotal(card);
      if (!Number.isInteger(dcTotal) || dcTotal <= 0) {
        debug("Skipping chat card because D35E did not render a positive DC.", { itemId, actor: actor?.name });
        continue;
      }

      insertChatDCRow(card, dcTotal);
    }
  }

  function displayAbilityMod(spellbook) {
    const ability = String(spellbook?.ability ?? "").trim();
    return ability ? `${ability.toUpperCase()} mod` : "ability mod";
  }

  function readableFormula(spellbook) {
    const raw = String(spellbook?.baseDCFormula ?? "10 + @sl + @ablMod").trim() || "10 + @sl + @ablMod";
    return raw
      .replaceAll("@sl", "spell level")
      .replaceAll("@ablMod", displayAbilityMod(spellbook))
      .replaceAll("@cl", "caster level");
  }

  function insertSpellbookSummary(spellbookRoot, spellbook) {
    const attributes = spellbookRoot.querySelector("ul.attributes.misc-defenses.flexrow");
    if (!attributes || attributes.querySelector(`.${INSERTED_SHEET_CLASS}`)) return;

    const li = document.createElement("li");
    li.className = `attribute high tooltip ${INSERTED_SHEET_CLASS}`;
    li.dataset.attribute = "spell-save-dc";

    const title = document.createElement("h4");
    title.className = "attribute-name box-title";
    title.textContent = localize("D35ESpellSaveDC.Sheet.Label", "Spell Save DC");

    const value = document.createElement("div");
    value.className = "attribute-value";

    const span = document.createElement("span");
    span.textContent = readableFormula(spellbook);
    value.append(span);

    const footer = document.createElement("footer");
    footer.className = "attribute-footer";
    footer.textContent = `${localize("D35ESpellSaveDC.Sheet.Formula", "Formula")}: ${String(
      spellbook?.baseDCFormula ?? "10 + @sl + @ablMod"
    )}`;

    li.append(title, value, footer);
    attributes.append(li);
  }

  function enhanceActorSheet(app, html) {
    if (!isD35E()) return;

    const actor = app?.actor;
    if (!actor?.system?.attributes?.spells?.spellbooks) return;

    const root = normalizeHtml(html);
    if (!root) return;

    const spellbookRoots = Array.from(root.querySelectorAll(".spellbook-group[data-tab]"));
    for (const spellbookRoot of spellbookRoots) {
      const spellbookIndex = spellbookRoot.dataset.tab;
      const spellbook = getProperty(actor.system, `attributes.spells.spellbooks.${spellbookIndex}`);
      if (!spellbook) {
        debug("Skipping sheet spellbook with no matching actor data.", { actor: actor.name, spellbookIndex });
        continue;
      }

      insertSpellbookSummary(spellbookRoot, spellbook);
    }
  }

  Hooks.once("init", () => {
    game.settings.register(MODULE_ID, "debug", {
      name: "D35ESpellSaveDC.Settings.Debug.Name",
      hint: "D35ESpellSaveDC.Settings.Debug.Hint",
      scope: "client",
      config: true,
      type: Boolean,
      default: false
    });
  });

  Hooks.on("renderChatMessageHTML", (_message, html) => enhanceChatMessage(html));
  Hooks.on("renderChatMessage", (_message, html) => enhanceChatMessage(html));
  Hooks.on("renderActorSheet", (app, html) => enhanceActorSheet(app, html));
})();
