import { Component } from '@theme/component';
import { removeTrapFocus, trapFocus } from '@theme/focus';
import { onAnimationEnd } from '@theme/utilities';

/**
 * A custom element that manages the size guide drawer.
 *
 * @typedef {object} Refs
 * @property {HTMLDetailsElement} details - The details element.
 *
 * @extends {Component<Refs>}
 */
class SizeGuideDrawer extends Component {
  requiredRefs = ['details'];

  /** @type {HTMLElement | null} */
  #drawerWrapper = null;
  /** @type {Function | null} */
  #boundBackdropClick = null;
  /** @type {Function | null} */
  #boundCloseClick = null;

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('keyup', this.#onKeyUp);
    
    // Create a wrapper element in body for the drawer to escape stacking contexts
    this.#createDrawerWrapper();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keyup', this.#onKeyUp);
    
    // Clean up the wrapper when component is disconnected
    this.#drawerWrapper?.remove();
  }

  /**
   * Create a wrapper element in body for the drawer
   */
  #createDrawerWrapper() {
    this.#drawerWrapper = document.createElement('div');
    this.#drawerWrapper.className = 'size-guide-drawer-wrapper';
    this.#drawerWrapper.style.cssText = 'position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: 9999; pointer-events: none;';
    document.body.appendChild(this.#drawerWrapper);
  }

  /**
   * Close the size guide drawer when the Escape key is pressed
   * @param {KeyboardEvent} event
   */
  #onKeyUp = (event) => {
    if (event.key !== 'Escape') return;

    this.#close(this.#getDetailsElement(event));
  };

  /**
   * @returns {boolean} Whether the size guide drawer is open
   */
  get isOpen() {
    return this.refs.details.hasAttribute('open');
  }

  /**
   * Get the closest details element to the event target
   * @param {Event | undefined} event
   * @returns {HTMLDetailsElement}
   */
  #getDetailsElement(event) {
    if (!(event?.target instanceof Element)) return this.refs.details;

    return event.target.closest('details') ?? this.refs.details;
  }

  /**
   * Toggle the size guide drawer
   */
  toggle() {
    return this.isOpen ? this.close() : this.open();
  }

  /**
   * Open the closest drawer or the size guide drawer
   * @param {Event} [event]
   */
  open(event) {
    const details = this.#getDetailsElement(event);
    const summary = details.querySelector('summary');

    if (!summary) return;

    summary.setAttribute('aria-expanded', 'true');
    // mark details as open so `isOpen` reflects state
    details.setAttribute('open', '');

    // Lock body scroll
    document.body.style.overflow = 'hidden';

    // Move drawer and backdrop to body wrapper to escape stacking contexts
    const drawer = details.querySelector('.size-guide-drawer');
    const backdrop = details.querySelector('.size-guide-drawer__backdrop');
    
    if (this.#drawerWrapper && drawer) {
      this.#drawerWrapper.style.pointerEvents = 'auto';
      this.#drawerWrapper.appendChild(backdrop);
      this.#drawerWrapper.appendChild(drawer);
      // attach click handlers because the template's on:click bindings
      // won't resolve once moved out of the original component scope
      if (backdrop) {
        this.#boundBackdropClick = () => this.close();
        backdrop.addEventListener('click', this.#boundBackdropClick);
      }
      const closeButton = drawer.querySelector('.size-guide-drawer__close-button');
      if (closeButton) {
        this.#boundCloseClick = () => this.close();
        closeButton.addEventListener('click', this.#boundCloseClick);
      }
    }

    requestAnimationFrame(() => {
      details.classList.add('menu-open');
      this.#drawerWrapper?.classList.add('menu-open');

      // Wait for the drawer animation to complete before trapping focus
      onAnimationEnd(drawer || details, () => trapFocus(this.#drawerWrapper || details), { subtree: false });
    });
  }

  /**
   * Close the size guide drawer
   */
  close() {
    this.#close(this.refs.details);
  }

  /**
   * Close the drawer with animation
   * @param {HTMLDetailsElement} details
   */
  #close(details) {
    const summary = details.querySelector('summary');

    if (summary) {
      summary.setAttribute('aria-expanded', 'false');
    }

    details.classList.remove('menu-open');
    this.#drawerWrapper?.classList.remove('menu-open');

    // Unlock body scroll
    document.body.style.overflow = '';

    // Wait for the .size-guide-drawer element's transition
    const drawer = this.#drawerWrapper?.querySelector('.size-guide-drawer');
    const backdrop = this.#drawerWrapper?.querySelector('.size-guide-drawer__backdrop');

    onAnimationEnd(
      drawer || details,
      () => {
        // Move drawer and backdrop back to details element
        if (drawer) {
          // remove attached listeners
          const closeButton = drawer.querySelector('.size-guide-drawer__close-button');
          if (closeButton && this.#boundCloseClick) closeButton.removeEventListener('click', this.#boundCloseClick);
          this.#boundCloseClick = null;
          details.appendChild(drawer);
        }
        if (backdrop) {
          if (backdrop && this.#boundBackdropClick) backdrop.removeEventListener('click', this.#boundBackdropClick);
          this.#boundBackdropClick = null;
          details.appendChild(backdrop);
        }
        if (this.#drawerWrapper) {
          this.#drawerWrapper.style.pointerEvents = 'none';
        }
        
        reset(details);
        removeTrapFocus();
      },
      { subtree: false }
    );
  }
}

if (!customElements.get('size-guide-drawer')) {
  customElements.define('size-guide-drawer', SizeGuideDrawer);
}

/**
 * Reset an open details element to its original state
 *
 * @param {HTMLDetailsElement} element
 */
function reset(element) {
  element.classList.remove('menu-open');
  element.removeAttribute('open');
  element.querySelector('summary')?.setAttribute('aria-expanded', 'false');
}
