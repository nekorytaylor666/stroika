import { createAccessControl } from "better-auth/plugins/access";
import {
	defaultStatements,
	adminAc,
} from "better-auth/plugins/organization/access";

export const statements = {
	...defaultStatements,
};

export const ac = createAccessControl(statements);
