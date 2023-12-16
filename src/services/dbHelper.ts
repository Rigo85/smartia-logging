// import { BECOClient, BECOCommitment, BECOCommitmentKind } from "digevo-models";
// import { DeepPartial, FindOneOptions } from "typeorm";
// import { Logger } from "digevo-logger";
// import { toChileanDateTime } from "(src)/services/actions/actionsHelper";
//
// const logger = new Logger("DB Helper");
//
// export interface BecoClientResult {
// 	client: BECOClient;
// 	message: string;
// }
//
// export async function getBecoClient(batchDetailId: string, clientId: string): Promise<BecoClientResult> {
// 	try {
// 		const queryData: DeepPartial<BECOClient> = {};
//
// 		if (!batchDetailId && !clientId) {
// 			const message = "Missing parameters, 'batchDetailId' or 'clientId' are required.";
// 			logger.error(message);
// 			return {client: undefined, message};
// 		}
//
// 		if (batchDetailId) {
// 			queryData.batchDetailId = parseInt(batchDetailId);
// 		} else {
// 			queryData.id = parseInt(clientId);
// 		}
//
// 		const client = await BECOClient.findOne({
// 			where: {...queryData},
// 			order: {id: "DESC"}
// 		} as FindOneOptions<BECOClient>);
//
// 		return {client, message: client ? "Ok" : `No Client Exist for '${JSON.stringify(queryData)}'.`};
// 	} catch (error) {
// 		logger.error("getBecoClient", error);
//
// 		return {client: undefined, message: error.message};
// 	}
// }
//
// export async function createAudioIssueOnWelcome(client: BECOClient, kind: BECOCommitmentKind, sessionId: string): Promise<any> {
// 	saveCommitment(client, kind, sessionId);
// }
//
// export async function saveCommitment(client: BECOClient, kind: BECOCommitmentKind,
// 	sessionId: string, utterance: string = undefined, commitmentDate: Date = undefined): Promise<any> {
// 	const commitment = new BECOCommitment();
// 	commitment.commitmentDate = commitmentDate;
// 	commitment.userSayOriginal = utterance || "";
// 	commitment.createdAt = toChileanDateTime(new Date());
// 	commitment.batchId = client.batchId;
// 	commitment.commitmentKind = kind;
// 	commitment.client = client;
// 	commitment.emerixCode = kind.emerixCode;
// 	commitment.batchDetailId = client.batchDetailId;
// 	commitment.sessionId = sessionId;
// 	return commitment.save();
// }
