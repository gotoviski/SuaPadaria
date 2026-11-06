package com.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;

@Service
public class TwilioSmsService implements SmsService {

	private static final Logger log = LoggerFactory.getLogger(TwilioSmsService.class);

	private final String accountSid;
	private final String authToken;
	private final String fromNumber;
	private final boolean enabled;

	public TwilioSmsService(
			@Value("${twilio.account-sid:}") String accountSid,
			@Value("${twilio.auth-token:}") String authToken,
			@Value("${twilio.from-number:}") String fromNumber) {
		this.accountSid = accountSid;
		this.authToken = authToken;
		this.fromNumber = fromNumber;
		this.enabled = !accountSid.isBlank() && !authToken.isBlank() && !fromNumber.isBlank();
		if (!enabled) {
			log.warn("Credenciais do Twilio não configuradas - SMS serão apenas registrados no log");
		}
	}

	@Override
	public void send(String toPhone, String message) {
		if (!enabled) {
			log.info("[SMS] para {}: {}", toPhone, message);
			return;
		}
		Twilio.init(accountSid, authToken);
		Message.creator(new PhoneNumber(toPhone), new PhoneNumber(fromNumber), message).create();
	}

}
