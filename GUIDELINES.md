# Frontend Architectural Guidelines

## 1. Directory Structure

We follow a feature-based directory structure to improve maintainability and scalability.

```
src/
  components/
    features/           # Feature-specific components
      AddResident/      # "Add Resident" feature (Wizard)
        AddResidentWizard.tsx  # Main container (Logic/State)
        Step1FamilyDetails.tsx # Step 1: Family Details
        Step2FamilyHead.tsx    # Step 2: Family Head
        Step3FamilyMembers.tsx # Step 3: Family Members
        types.ts               # Feature-specific types
      Document/         # "Document Issuance" feature
        DocumentIssuanceFlow.tsx
        types.ts
    ui/                 # Reusable UI components (Buttons, Inputs, Cards)
    layout/             # Layout components (Sidebar, Header)
  pages/                # Page components (Route handlers)
  context/              # Global state (Auth, Theme)
  hooks/                # Custom hooks
  types/                # Global types
```

## 2. Design Patterns

### Container-Presentation Pattern
For complex features (like Wizards or Multi-step forms), separate logic from UI.

*   **Container (Smart Component):** Handles state, validation, API calls, and navigation.
    *   Example: `AddResidentWizard.tsx`
*   **Presentation (Dumb Component):** Receives data and callbacks via props. Renders UI.
    *   Example: `Step1FamilyDetails.tsx`

### Prop Drilling vs. Context
*   Use **Context** for global state (Auth, Theme).
*   Use **Props** for feature-specific state (Form data in a wizard).
*   If props go deeper than 3 levels, consider a local Context for that feature.

## 3. State Management

*   **Local State (`useState`):** For simple UI state (toggles, input values).
*   **Complex State (`useReducer`):** For complex form state with multiple related fields.
*   **Form Handling:** Controlled components are preferred. Validation should happen on change or blur.

## 4. Async Handling

*   Use `async/await`.
*   Always implement `try/catch` blocks.
*   Show loading states (`isLoading`) during async operations.
*   Handle errors gracefully (show toast notifications or error messages).

## 5. Coding Standards

*   **Types:** Use TypeScript interfaces/types for all props and state. Avoid `any`.
*   **Naming:** PascalCase for components (`MyComponent`), camelCase for functions/vars (`myFunction`).
*   **Exports:** Named exports preferred for consistency.
