const chatController = require('./src/controllers/chatController');

// Mock request and response
const runTest = async (userId, divisiId) => {
    const req = {
        params: { id: divisiId },
        user: { user_id: userId }
    };
    const res = {
        status: function (code) {
            this.statusCode = code;
            return this;
        },
        json: function (data) {
            console.log(`RESULT for Divisi ${divisiId}:`, {
                statusCode: this.statusCode || 200,
                data
            });
        }
    };

    try {
        await chatController.getChatHistory(req, res, () => { });
    } catch (err) {
        console.error(err);
    }
};

async function main() {
    const hermanId = "97f61f88-71c8-488d-97fb-584f290bd429";
    const newVendorRoomId = "57c84ee9-5c3e-4d66-9fc9-58608e69e25c";
    const oldVendorRoomId = "02636c3d-33c8-42c0-885a-7994260edb46";

    console.log("--- TESTING NEW ROOM ---");
    await runTest(hermanId, newVendorRoomId);

    console.log("\n--- TESTING OLD ROOM ---");
    await runTest(hermanId, oldVendorRoomId);
}

main();
