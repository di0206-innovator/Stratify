const path = require('path');

function getWritableDataDir(env = process.env) {
    if (env.WRITABLE_DATA_DIR) {
        return env.WRITABLE_DATA_DIR;
    }

    if (env.VERCEL || env.AWS_LAMBDA_FUNCTION_NAME || env.LAMBDA_TASK_ROOT) {
        return path.join('/tmp', 'stratify-data');
    }

    return path.join(process.cwd(), 'data');
}

function getWritableDataPath(...segments) {
    return path.join(getWritableDataDir(), ...segments);
}

module.exports = {
    getWritableDataDir,
    getWritableDataPath
};
