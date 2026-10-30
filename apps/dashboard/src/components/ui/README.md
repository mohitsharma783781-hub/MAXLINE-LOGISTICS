# Global Reusable UI Component Reference

This directory contains the generic, atomic, domain-neutral UI component library for the Shipping SaaS Platform.

## Architectural Rules

> [!IMPORTANT]
> 1. **Domain Neutrality**: NEVER put business logic or shipment/courier domain names inside these components. Keep them 100% generic.
> 2. **Design Tokens**: Every component exclusively consumes CSS variable tokens from `src/styles/tokens.css`.
> 3. **Feature Separation**: Feature-specific cards or domain panels belong inside their respective feature modules (e.g. `src/features/shipments/`, `src/features/wallet/`), NOT in `src/components/ui/`.

---

## Component Catalog & Usage Summary

### Form & Control Components
- **`Button`**: Primary, secondary, outline, ghost, danger, link variants; small (32px), medium (40px), large (44px) sizes; icon support (`leftIcon`, `rightIcon`); loading prevention state.
- **`Input`**: Text/email/password input with label, required asterisk `*`, leading/trailing icons, clear action button (`onClear`), readOnly, and error/helper text.
- **`Textarea`**: Multi-line text field with character count display (`showCharacterCount`), label, required asterisk, and error states.
- **`Select`**: Dropdown select wrapper with options, label, error, helper text, and keyboard accessibility.
- **`Checkbox`**: Accessible check box with label, checked, and disabled states.
- **`Radio`**: Accessible radio button control.
- **`Switch`**: Toggle switch control with checked, unchecked, and disabled states.
- **`SearchInput`**: Specialized search field with search icon, clear button, and focus ring.
- **`DatePicker`**: Date input control wrapper matching input styling.

### Surface & Layout Components
- **`Card`**: Surface container supporting `Card.Header`, `Card.Title`, `Card.Description`, `Card.Actions`, `Card.Body`, `Card.Content`, and `Card.Footer`.
- **`Badge`**: Generic status pill badge (`neutral`, `success`, `warning`, `danger`, `info`, `brand`) with small/medium sizes.
- **`Alert`**: Inline banner message (`info`, `success`, `warning`, `danger`) with optional title, description, action button, and dismiss handler.

### Navigation & Feedback Primitives
- **`Modal`**: Accessible dialog overlay with focus trap, ESC close, backdrop click, title, and action footer.
- **`Drawer`**: Slide-over panel container (`left` / `right` placement).
- **`Dropdown`**: Popover menu with trigger, item list, icons, and destructive item support.
- **`Tabs`**: Tab navigation bar with active indicator and badge count.
- **`Tooltip`**: Hover popover text trigger.
- **`ToastContainer`**: Toast notification container supporting auto-dismiss timers and stacked toast items.
- **`ConfirmationDialog`**: Reusable modal confirmation wrapper for destructive actions.

### Data & Asynchronous State Components
- **`Table`**: Generic table data grid supporting generic columns, rows, header, hover highlight, right-aligned numeric cells, horizontal scroll, and `isLoading` skeleton rows state.
- **`Pagination`**: Pagination bar with page count, current page, total items, and Previous/Next buttons.
- **`Spinner`**: Standalone SVG circular loading spinner.
- **`Skeleton`**: Composible pulsing loading placeholder lines.
- **`EmptyState`**: Blank data presenter with icon slot, title, description, and action button.
- **`ErrorState`**: Localized error message presenter with retry action.
