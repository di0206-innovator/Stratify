function createLogger({ env = process.env.NODE_ENV || 'development' } = {}) {
    return {
        info(message, fields = {}) {
            write('info', message, fields);
        },
        warn(message, fields = {}) {
            write('warn', message, fields);
        },
        error(message, fields = {}) {
            write('error', message, fields, env);
        }
    };
}

function write(level, message, fields, env) {
    const payload = {
        level,
        message,
        at: new Date().toISOString(),
        ...fields
    };

    if (level === 'error' && env === 'production') {
        delete payload.stack;
    }

    const line = JSON.stringify(payload);
    if (level === 'error') {
        console.error(line);
        return;
    }

    console.log(line);
}

module.exports = { createLogger };
