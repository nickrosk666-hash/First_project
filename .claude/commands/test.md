Test the codebase, find and fix errors:

1. Run `npm run build` to check for TypeScript and compilation errors
2. Run `npm run lint` to find linting issues
3. Review all source files and check by these criteria:

   **Readability:**
   - Are variable names clear and descriptive?
   - Are comments present where needed?
   - Are functions short and focused?

   **Errors:**
   - Is error handling in place?
   - Are there obvious bugs?

   **Security:**
   - Are there any passwords or secrets in the code?
   - Is input data validated?

4. Fix all found errors
5. Re-run build and lint to confirm everything passes
6. Report using this format:

   ✅ Criterion — all good
   ⚠️ Criterion — note: [description]
   ❌ Criterion — problem: [description]

   End with an overall score and the most important thing to fix.
