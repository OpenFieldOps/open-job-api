export namespace RealtimeModel {
	export enum RealtimeMessageType {
		JobUpdated = "job_updated",
	}

	export type RealtimeMessageTypeString = "job_updated";

	export type UserRealtimeMessage = {
		userId: number;
		type: RealtimeMessageType;
		data: unknown;
	};

	export type UserRealtimeMessageData = {
		type: RealtimeMessageType;
		data: unknown;
	};
}
