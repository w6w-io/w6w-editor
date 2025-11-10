import { z } from 'zod';

export const positionSchema = z
    .array(z.number()).min(2, {
        message: 'Position must have at least two coordinates [x, y]'
    }).max(3, {
        message: 'Position can have at most three coordinates [x, y, z]'
    });