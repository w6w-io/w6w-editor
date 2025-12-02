import z from "zod";

export const packageDefinitionSchema = z.object({

    package: z.string().min(1, { message: 'local, internal, github repo' }).describe('Name of the package'),

    app: z.string().min(1, { message: 'App key within the package' }).describe('Key of the app within the package'),

    version: z.string().min(1, { message: 'Package version is required' }).describe('Version of the package'),


});